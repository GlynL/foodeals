# Deployment pattern

How foodeals - and any other personal project - gets deployed. The aim is one
repeatable pattern: a single cheap box hosts many small projects, and adding a
new project is "copy a template, set a subdomain, push".

foodeals is the first project to use this pattern, so it doubles as the proving
ground. Once it has run end-to-end here, the per-project template can graduate
into its own GitHub _template repository_ for reuse.

## The shape in one paragraph

A single Hetzner VPS runs Docker. A shared [Traefik](https://traefik.io)
container watches the Docker socket and reverse-proxies to every project's
container, issuing a Let's Encrypt certificate per subdomain automatically.
Each project is a Docker Compose stack that joins a shared `proxy` network and
carries a few Traefik labels. Code ships via GitHub Actions: on push to `main`,
Actions builds a Docker image, pushes it to GHCR, then SSHes to the box to pull
and restart. DNS is a single wildcard record, so new projects need no DNS or
proxy changes at all.

## Scope and non-goals (for now)

This document is design plus a runbook. It intentionally does **not** cover:

- **Stateful services and backups.** Named volumes and a backup job (e.g.
  scheduled `pg_dump` to object storage) are a deliberate follow-on. The pattern
  is built so state can be added later without rework: keep data in a Docker
  named volume, never inside the image.
- **Provisioning automation.** The box is set up by hand once, following the
  runbook below. No Terraform/Ansible yet.

## Why these choices (decisions log)

| Decision      | Choice                                                   | Why                                                                                                                                         |
| ------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Host          | Single Hetzner VPS                                       | Best RAM-per-pound; one box hosts many projects on one bill. Builds happen in CI, so the box only _runs_ containers and stays small.        |
| Deploy layer  | Docker Compose + shared reverse proxy + copy-me template | Transparent primitives, no heavy control plane to maintain. "Easy to add a project" comes from a convention, not a dashboard.               |
| Reverse proxy | Traefik (label auto-discovery)                           | Each project declares its own route in its own compose file. Adding a project touches nothing central.                                      |
| Ship code     | GitHub Actions -> GHCR -> SSH                            | Box stays a dumb runner (never builds -> no OOM on a small VPS). Images are versioned. Deploys are explicit (happen when Actions finishes). |
| DNS           | Wildcard `*.glynlewington.com` -> box IP                 | New project = a subdomain that already resolves. Zero DNS work per project.                                                                 |
| App config    | Box-local `.env` per project, git-ignored                | Dead simple, standard, no extra service. Deploy creds live as GitHub Actions secrets instead.                                               |

Escape hatches if a project outgrows the defaults: a managed database (e.g.
Neon) is just a connection string and works from the Hetzner box unchanged;
encrypted-secrets-in-git (SOPS + age) can replace box-local `.env` later.

---

## One-time box setup (runbook)

Do this once per box. Roughly 20-30 minutes.

### 1. Provision the VPS

- Create a Hetzner Cloud project and a server. A CX22 (2 vCPU, 4 GB RAM) is
  plenty of headroom for several small projects.
- Choose a region, add your SSH public key, boot it.
- Note the public IPv4 address; call it `BOX_IP` below.

### 2. Install Docker

SSH in as root (or a sudo user) and install Docker Engine + the Compose plugin:

```sh
curl -fsSL https://get.docker.com | sh
```

### 3. Create the shared proxy network

Every project joins this network so Traefik can reach it. Create it once:

```sh
docker network create proxy
```

### 4. Run the shared Traefik proxy

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

Start it:

```sh
cd /opt/traefik && docker compose up -d
```

### 5. Point DNS at the box

At your DNS host for `glynlewington.com`, add one record:

- `*.glynlewington.com` -> A record -> `BOX_IP`

Keep it **DNS-only** (if using Cloudflare, grey cloud, not orange) so Traefik
owns TLS directly. The apex `glynlewington.com` is untouched - the wildcard only
matches subdomains.

### 6. Set up the deploy SSH key

GitHub Actions needs a key to SSH in and restart projects. Generate a dedicated
key pair (not your personal one):

```sh
ssh-keygen -t ed25519 -f deploy_key -C "github-actions-deploy" -N ""
```

- Add the **public** half (`deploy_key.pub`) to the box's
  `~/.ssh/authorized_keys` for the deploy user.
- Keep the **private** half for the per-repo secret (next section). Store it
  nowhere else; delete your local copy once it is in GitHub.

### 7. GHCR pull access (once, if images are private)

By default GHCR packages are private. Either make each project's package public,
or let the box pull private images by logging in once with a Personal Access
Token that has `read:packages`:

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
            cd /opt/projects/foodeals
            docker compose pull
            docker compose up -d
```

Per-repo secrets to add (Settings -> Secrets and variables -> Actions):

- `SSH_HOST` - the box IP
- `SSH_USER` - the deploy user
- `SSH_KEY` - the **private** deploy key from box setup step 6

`GITHUB_TOKEN` is provided automatically; no need to create it.

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
   `ghcr.io/glynl/<project>`.
3. **On the box:** create the project dir and its `.env`:
   ```sh
   mkdir -p /opt/projects/<project>
   # scp or write docker-compose.yml + .env into it
   ```
4. **Add the repo secrets:** `SSH_HOST`, `SSH_USER`, `SSH_KEY`.
5. **Push to `main`.** Actions builds, pushes, and deploys. Traefik picks up the
   new container from its labels and issues the certificate on first request.

Visit `https://<project>.glynlewington.com`.
