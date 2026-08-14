# Deployment pattern

How foodeals - and any other personal project - gets deployed. The aim is one
repeatable pattern: a single cheap box hosts many small projects, and adding a
new project is "copy a template, set a subdomain, push".

foodeals proved the pattern end to end and is live at
`https://foodeals.glynlewington.com`. Everything below reflects what was actually
built, including the parts that only became obvious once it was running. The
per-project template can now graduate into its own GitHub _template repository_
for reuse.

## The shape in one paragraph

A single VPS runs Docker. A shared [Traefik](https://traefik.io) container
watches the Docker socket and reverse-proxies to every project's container,
issuing a Let's Encrypt certificate per subdomain automatically. Each project is
a Docker Compose stack that joins a shared `proxy` network and carries a few
Traefik labels. Code ships via GitHub Actions: on push to `main`, Actions builds
a Docker image, pushes it to GHCR, then SSHes to the box to pull and restart. DNS
is a single wildcard record, so new projects need no DNS or proxy changes at all.

## Scope and non-goals (for now)

This document is design plus a runbook. It intentionally does **not** cover:

- **Stateful services and backups.** Named volumes and a backup job (e.g.
  scheduled `pg_dump` to object storage) are a deliberate follow-on. The pattern
  is built so state can be added later without rework: keep data in a Docker
  named volume, never inside the image.
- **Provisioning automation.** The box is set up by hand once, following the
  runbook below. No Terraform/Ansible yet.
- **Monitoring and alerting.** Nothing watches the box or the certificates.

## Why these choices (decisions log)

| Decision      | Choice                                                   | Why                                                                                                                                            |
| ------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Host          | Single DigitalOcean droplet                              | Hetzner was the intent (best RAM-per-pound) but had no CX or CAX stock; CPX started at EUR 11.99. DO also has a London region.                 |
| Box size      | $6/mo, 1 vCPU / 1 GB / 25 GB                             | The box only _runs_ containers - builds happen in CI - so it stays small. RAM and CPU resize upward later; disk does not shrink again.         |
| Swap          | 1 GB swapfile on boxes at or below 1 GB                  | Cheap insurance against the OOM killer. Not needed at 4 GB.                                                                                    |
| Deploy layer  | Docker Compose + shared reverse proxy + copy-me template | Transparent primitives, no heavy control plane to maintain. "Easy to add a project" comes from a convention, not a dashboard.                  |
| Reverse proxy | Traefik (label auto-discovery)                           | Each project declares its own route in its own compose file. Adding a project touches nothing central.                                         |
| Ship code     | GitHub Actions -> GHCR -> SSH                            | Box stays a dumb runner (never builds -> no OOM on a small VPS). Deploys are explicit (they happen when Actions finishes).                     |
| DNS           | Wildcard `*.glynlewington.com` -> box IP                 | New project = a subdomain that already resolves. Zero DNS work per project.                                                                    |
| App config    | Box-local `.env` per project, git-ignored                | Dead simple, standard, no extra service. Deploy creds live as GitHub Actions secrets instead.                                                  |
| Image tags    | `:latest` only                                           | Rolling back is `git revert` + push, which rebuilds `:latest`. Per-commit SHA tags were tried here and removed - nothing ever referenced them. |

Escape hatches if a project outgrows the defaults: a managed database (e.g. Neon)
is just a connection string and works from the box unchanged;
encrypted-secrets-in-git (SOPS + age) can replace box-local `.env` later.

### The current box

DigitalOcean, London (LON1), Ubuntu 24.04 LTS, $6/mo, hostname `projects`, public
IP `64.227.34.89`. Firewall allows inbound 22, 80 and 443. Traefik lives in
`/opt/traefik`, projects in `/opt/projects/<project>`. With the OS, Docker and
Traefik running, the baseline is roughly **385 MB used, 575 MB available**.

`/opt` because it sits alongside `/opt/traefik`, so one `ls` shows everything
deployed, and because staying out of `/root` means moving to a non-root deploy
user later is a `chown` rather than a path migration across every repo. The path
is a contract between each repo's workflow and the box, so it is worth being
deliberate about.

### If your machine blocks outbound port 22

Corporate laptops often do, which changes how the runbook is followed:

- GitHub over SSH still works via its 443 endpoint. In `~/.ssh/config`:
  ```
  Host github.com
    Hostname ssh.github.com
    Port 443
    User git
  ```
- **The box cannot be reached by SSH at all.** Do box admin through the
  provider's browser console, or from another machine. Generate the deploy key on
  the box rather than locally (runbook step 7).
- Repo creation and secrets are done in the GitHub web UI instead of `gh`.
- None of this affects deploys: GitHub Actions reaches the box on port 22 from
  its own runners.

---

## One-time box setup (runbook)

Do this once per box. Roughly 20-30 minutes.

### 1. Provision the VPS

- Create a droplet: Ubuntu LTS, the cheapest Basic Regular SSD tier, in the
  region nearest your users. Add your SSH public key during creation.
- Allow inbound 22, 80 and 443 in the provider firewall.
- Note the public IPv4 address; call it `BOX_IP` below.

Any provider works - the rest of the runbook is provider-agnostic. Enabling IPv6
on the droplet is harmless, but leave the AAAA record until you actually want it.

### 2. Add swap (boxes at or below 1 GB)

```sh
fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 3. Install Docker

```sh
curl -fsSL https://get.docker.com | sh
```

### 4. Create the shared proxy network

Every project joins this network so Traefik can reach it. Create it once:

```sh
docker network create proxy
```

### 5. Run the shared Traefik proxy

Put this at `/opt/traefik/docker-compose.yml` on the box:

```yaml
services:
  traefik:
    image: traefik:v3
    restart: unless-stopped
    command:
      # Watch Docker; only expose containers that opt in with a label.
      - '--providers.docker=true'
      - '--providers.docker.exposedbydefault=false'
      - '--entrypoints.web.address=:80'
      - '--entrypoints.websecure.address=:443'
      # Send all plain HTTP to HTTPS.
      - '--entrypoints.web.http.redirections.entrypoint.to=websecure'
      - '--entrypoints.web.http.redirections.entrypoint.scheme=https'
      # Let's Encrypt via HTTP-01 challenge; one cert per subdomain, on demand.
      - '--certificatesresolvers.le.acme.email=you@glynlewington.com'
      - '--certificatesresolvers.le.acme.storage=/letsencrypt/acme.json'
      - '--certificatesresolvers.le.acme.httpchallenge=true'
      - '--certificatesresolvers.le.acme.httpchallenge.entrypoint=web'
    ports:
      - '80:80'
      - '443:443'
    volumes:
      # Read-only socket = how Traefik discovers containers and their labels.
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-letsencrypt:/letsencrypt
    networks:
      - proxy

volumes:
  traefik-letsencrypt:

networks:
  proxy:
    external: true
```

The named volume matters: `acme.json` holds the issued certificates, so without
it every restart re-requests them and eventually meets Let's Encrypt's rate
limits.

```sh
cd /opt/traefik
docker compose config
grep -n "httpchallenge.entrypoint\|docker.sock" docker-compose.yml
docker compose up -d
```

### 6. Point DNS at the box

At your DNS host for `glynlewington.com`, add one record:

- `*.glynlewington.com` -> A record -> `BOX_IP`

Keep it **DNS-only** (if using Cloudflare, grey cloud, not orange) so Traefik
owns TLS directly. The apex `glynlewington.com` is untouched - the wildcard only
matches subdomains.

Check it before moving on. A 404 over HTTPS is correct until a project exists:

```sh
dig +short <anything>.glynlewington.com     # should return BOX_IP
curl -sSI http://<anything>.glynlewington.com   # should be a 308 to HTTPS
```

### 7. Set up the deploy SSH key

GitHub Actions needs a key to SSH in and restart projects. Generate a dedicated
key pair (not your personal one):

```sh
ssh-keygen -t ed25519 -f deploy_key -C "github-actions-deploy" -N ""
```

- Add the **public** half (`deploy_key.pub`) to the box's `~/.ssh/authorized_keys`
  for the deploy user. This is the half that stays, and it is what verifies
  Actions' key on every deploy.
- The **private** half goes into the per-repo `SSH_KEY` secret and nowhere else.
  The box never needs it - it only verifies, never proves.

```sh
rm -f deploy_key deploy_key.pub   # once a deploy is green
```

### 8. GHCR pull access (private repos only)

A package pushed with `GITHUB_TOKEN` **inherits its repository's visibility**, so
for a public repo the box can pull immediately and there is nothing to do here.
Don't go looking for a permissions problem you don't have.

For a private repo the package is private too, so either make the package public
in its settings, or log the box in once with a Personal Access Token that has
`read:packages`:

```sh
echo "$GHCR_PAT" | docker login ghcr.io -u <github-username> --password-stdin
```

---

## Per-project template files

Everything a project needs to deploy lives in its own repo. These are the files
to copy in. Examples use foodeals; substitute the project name and subdomain.

### `Dockerfile`

Multi-stage: build with the full toolchain, then run from a slim image. foodeals
builds with `tsc` to `dist/` (see `package.json`).

```dockerfile
# --- build stage ---
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- run stage ---
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/data ./data
EXPOSE 3000
CMD ["node", "dist/http/index.js"]
```

### `docker-compose.yml`

Joins the shared `proxy` network and declares its own route via labels. This is
the only place routing lives - no central file to edit.

```yaml
services:
  app:
    image: ghcr.io/glynl/foodeals:latest
    restart: unless-stopped
    env_file: .env # box-local, git-ignored (see .env.example)
    networks:
      - proxy
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.foodeals.rule=Host(`foodeals.glynlewington.com`)'
      - 'traefik.http.routers.foodeals.entrypoints=websecure'
      - 'traefik.http.routers.foodeals.tls.certresolver=le'
      # ${PORT} is read from .env (same file the container gets via env_file),
      # so this stays in sync with whatever port the app actually listens on.
      - 'traefik.http.services.foodeals.loadbalancer.server.port=${PORT:-3000}'

networks:
  proxy:
    external: true
```

### `.github/workflows/deploy.yml`

On push to `main`: build, push to GHCR, then SSH to the box to pull and restart.

```yaml
name: deploy
on:
  push:
    branches: [main]
    # Docs-only commits shouldn't rebuild and restart the app. Add any other
    # non-code directories the project keeps.
    paths-ignore:
      - '**.md'
      - 'docs/**'

# Queue deploys rather than overlap them: two concurrent `compose up -d` runs in
# the same project directory collide mid-recreate. Cancelling does the same,
# hence cancel-in-progress: false.
concurrency:
  group: deploy-foodeals
  cancel-in-progress: false

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write # allow pushing to GHCR with GITHUB_TOKEN
    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ghcr.io/glynl/foodeals:latest

      - name: Deploy over SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            set -e
            cd /opt/projects/foodeals
            docker compose pull
            docker compose up -d
            # The image the previous deploy was running is now untagged.
            docker image prune -f
```

Per-repo secrets to add (Settings -> Secrets and variables -> Actions):

- `SSH_HOST` - the box IP
- `SSH_USER` - the deploy user
- `SSH_KEY` - the **private** deploy key from box setup step 7

`GITHUB_TOKEN` is provided automatically; no need to create it.

Repository secrets are fine while the deploy workflow is the only workflow. Once
a repo has others - CI, for instance - move these into an `environment` so only
the deploy job can read them.

### `.env.example`

Committed as documentation. The real `.env` is created on the box and never
committed.

```sh
# Copy to .env on the box and fill in. Do not commit the real .env.
PORT=3000
# DATABASE_URL=postgres://...   # when a project needs one
```

### `.gitignore` / `.dockerignore`

```gitignore
# .gitignore
.env
node_modules
dist
```

```gitignore
# .dockerignore  (keep the build context small and secret-free)
.git
.env
node_modules
dist
```

---

## Add a new project (checklist)

For each new project. DNS and the Traefik proxy need **zero** changes.

1. **Copy the template files** above into the repo. Adjust the project name and
   the `Host(...)` subdomain (e.g. `blog.glynlewington.com`).
2. **Set the image name** in `docker-compose.yml` and the workflow to
   `ghcr.io/glynl/<project>`, and the `concurrency` group to match.
3. **Add the repo secrets:** `SSH_HOST`, `SSH_USER`, `SSH_KEY`.
4. **Push to `main`.** Expect this first run to fail at the deploy step, because
   the box directory doesn't exist yet. Pushing first is deliberate - it puts the
   compose file on `main` where the next step can fetch it.
5. **On the box:** create the project directory. Fetch the compose file rather
   than pasting it, so a browser console can't mangle it:

   ```sh
   mkdir -p /opt/projects/<project> && cd /opt/projects/<project>
   curl -fsSL -o docker-compose.yml \
     https://raw.githubusercontent.com/GlynL/<project>/main/docker-compose.yml
   printf 'PORT=3000\n' > .env
   chmod 600 .env          # /opt is 755, so .env is world-readable otherwise
   docker compose config   # confirms the fetch is intact and PORT interpolated
   ```

   `raw.githubusercontent.com` only works for a public repo; otherwise paste the
   file and verify it the same way. Nothing in CI ever copies these two files -
   the deploy job only runs `pull` and `up -d` in that directory - so both must
   already exist.

6. **Re-run the failed deploy job.** No new commit needed.

Visit `https://<project>.glynlewington.com`. Traefik requests the certificate on
first request to that hostname, so expect a certificate warning for up to a
minute while ACME issues it.

### Verify it

```sh
curl -sS https://<project>.glynlewington.com/health
curl -sSI http://<project>.glynlewington.com | head -1   # 308 to HTTPS
echo | openssl s_client -servername <project>.glynlewington.com \
  -connect <project>.glynlewington.com:443 2>/dev/null \
  | openssl x509 -noout -issuer -dates
```

The issuer should be Let's Encrypt, not Traefik's self-signed default. A plain
`curl` succeeding is itself proof the chain is trusted, since curl rejects
untrusted certificates by default.

Run status is readable without `gh` or a token for a public repo:

```sh
curl -sS "https://api.github.com/repos/GlynL/<project>/actions/runs?per_page=1"
```
