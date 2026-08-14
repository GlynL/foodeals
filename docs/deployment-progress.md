# Deployment progress log

Working log for the first run of the pattern in `docs/deployment.md`. foodeals is
the proving ground, so this records what actually happened - including where the
pattern doc turned out to be wrong or incomplete.

**Status: step 10 of 10.** Everything is in place either side of the wire; what
remains is one green deploy run and the verification that follows it.

Last updated: 2026-08-14.

## Decisions taken during setup

| Decision     | Choice                       | Why                                                                                                                                                                |
| ------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Host         | DigitalOcean, not Hetzner    | Hetzner had no CX stock and no CAX stock; CPX started at EUR 11.99. DO also has a London region.                                                                   |
| Droplet size | $6/mo, 1 vCPU / 1 GB / 25 GB | Box only runs containers (builds happen in CI). Resizing RAM/CPU upward later is reversible on DO.                                                                 |
| Database     | Not on the box               | Postgres would take 150-250 MB of the ~570 MB free. Use a managed provider (Neon etc.) per the doc's escape hatch.                                                 |
| Swap         | 1 GB swapfile added          | Not in the pattern doc, which assumed a 4 GB box. Cheap insurance against the OOM killer on 1 GB.                                                                  |
| CI gating    | None for now                 | Deploy workflow only. `ci.yml` stays on ROADMAP.                                                                                                                   |
| `SSH_USER`   | `root`                       | Simplest. Trade-off: Actions secrets compromise = box compromise. A non-root `deploy` user is the tighter option.                                                  |
| GHCR access  | Public package, no box login | Keeps credentials off the box; the image holds no secrets. Came free: a package pushed with `GITHUB_TOKEN` inherits the repo's visibility, and the repo is public. |

## Environment constraints (work laptop)

These shaped how the setup was done and will apply again next session.

- **Outbound port 22 is blocked on the CTM laptop.** GitHub works via its 443
  endpoint - `~/.ssh/config` has:
  ```
  Host github.com
    Hostname ssh.github.com
    Port 443
    User git
  ```
- **The box cannot be reached by SSH from this laptop** for the same reason.
  Box admin is done via DigitalOcean's browser console, or from another machine.
- **`gh` CLI deliberately not installed.** Repo creation and secrets are done in
  the GitHub web UI; pushing uses plain `git` over the 443 route above.
- GitHub Actions reaches the box on port 22 from Azure runners, so the
  deploy step is unaffected by any of this.

## Done

- **Step 1 - local prerequisites.** Docker Desktop present, `git` present,
  `brew` present. `gh` skipped on purpose.
- **Step 2 - domain.** `glynlewington.com` already owned, DNS on Cloudflare.
- **Step 3 - droplet.** DigitalOcean, London (LON1), Ubuntu 24.04 LTS, Basic
  Regular SSD $6/mo. Hostname `projects`. Public IP **64.227.34.89**. IPv6
  enabled on the droplet. Firewall: inbound 22, 80, 443.
- **Step 4 - Docker, network, Traefik.** Docker Engine + Compose plugin
  installed via `get.docker.com`. `docker network create proxy` done. Traefik
  v3 running from `/opt/traefik/docker-compose.yml`, bound on 80 and 443 over
  IPv4 and IPv6. 1 GB swapfile added and persisted in `/etc/fstab`.
  Memory baseline with OS + Docker + Traefik: **385 MB used, ~575 MB available**.
- **Step 5 - DNS.** Cloudflare wildcard `*.glynlewington.com` A record ->
  64.227.34.89, **DNS only (grey cloud)**. No AAAA record yet, deliberately.
  Verified: `dig +short foodeals.glynlewington.com` returns the IP, and
  `curl -sSI http://foodeals.glynlewington.com` returns `308` redirecting to
  HTTPS. A 404 over HTTPS is expected until step 9.
- **Step 6 - GitHub.** Repo `git@github.com:GlynL/foodeals.git`, `main` pushed
  and in sync.

- **Step 7 - deploy key and repo secrets.** Keypair generated **on the box**
  (not on the laptop as the pattern doc assumes - the laptop can't reach the box
  over 22), public half appended to `/root/.ssh/authorized_keys`. Three
  repository secrets added: `SSH_HOST` = 64.227.34.89, `SSH_USER` = `root`,
  `SSH_KEY` = the private half.
  - Repository secrets, not environment secrets: one box, one deploy target, no
    approval gate wanted. The trade-off is that every workflow in the repo can
    read them, which matters once `ci.yml` exists - tracked in `ROADMAP.md`.
  - The private key is only needed by Actions dialling in, never by the box, so
    it gets deleted from the box (see step 10). `authorized_keys` holds the
    public half and is what makes the match.
- **Step 8 - deployment files committed.** `docker-compose.yml` and
  `.github/workflows/deploy.yml` match `docs/deployment.md`'s templates (image
  `ghcr.io/glynl/foodeals:latest`, host `foodeals.glynlewington.com`). Pushing
  fired run 1, which failed as expected: `/opt/projects/foodeals` didn't exist
  yet. Worth doing in that order, because step 9's `curl` route needs the compose
  file to be on `main` first, and that beats pasting it into the console.
- **Step 9 - box project directory.** `/opt/projects/foodeals` holding the
  compose file and a `.env` of `PORT=3000`. CI never copies these; the deploy job
  only runs `docker compose pull && up -d` in that directory, so both must
  already be on the box. Fetched rather than pasted, so the console couldn't
  mangle it:
  ```sh
  mkdir -p /opt/projects/foodeals && cd /opt/projects/foodeals
  curl -fsSL -o docker-compose.yml \
    https://raw.githubusercontent.com/GlynL/foodeals/main/docker-compose.yml
  printf 'PORT=3000\n' > .env
  chmod 600 .env          # /opt is 755, so .env is world-readable otherwise
  docker compose config   # confirms the fetch is intact and PORT interpolated
  ```
  `raw.githubusercontent.com` only works because the repo is public. For a
  private repo, paste the file and verify with `docker compose config`.

## Remaining

### Step 10 - first deploy

Run 1's build and GHCR push succeeded; only `Deploy over SSH` failed, on the
missing directory that step 9 creates. **No GHCR work was needed**: the pattern
doc says packages are private by default, but one pushed with `GITHUB_TOKEN`
inherits the repo's visibility, and this repo is public. Verified anonymously:

```sh
TOKEN=$(curl -sS "https://ghcr.io/token?scope=repository:glynl/foodeals:pull&service=ghcr.io" \
  | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
curl -sS -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $TOKEN" \
  https://ghcr.io/v2/glynl/foodeals/manifests/latest   # 200 = public
```

So run 2 just needs a push, which also carries the `set -e` fix below.

Then visit `https://foodeals.glynlewington.com`. Traefik requests the
certificate on first request to that hostname.

Verify: `GET /health` and `GET /deals` both respond, and the certificate is a
real Let's Encrypt one.

Only once that's green, remove the private key from the box:

```sh
rm -f ~/.ssh/deploy_key ~/.ssh/deploy_key.pub
```

Deleting it earlier is a trap: GitHub secrets are write-only, so if the pasted
`SSH_KEY` turns out to be truncated there's nothing left to compare against and
the only fix is a fresh keypair.

## Gotchas hit (worth keeping)

- **The DO browser console mangles pasted text.** Three separate characters were
  silently dropped when pasting the Traefik compose file: `--` became `---`, a
  `:` vanished from `address=:80`, `httpchallenge.` vanished from the ACME
  challenge flag, and a `/` vanished from the docker.sock mount path. Always
  verify a pasted file on the box before trusting it:
  ```sh
  docker compose config
  grep -n "httpchallenge.entrypoint\|docker.sock" docker-compose.yml
  ```
- **Traefik fails fast and one error at a time.** It exits 1 on the first bad
  flag and dumps its entire help text, so the useful line is the last one.
  Filter for it:
  ```sh
  docker compose logs 2>&1 | grep '"level":"error"' | tail -3
  ```
- **The missing `/` in the docker.sock mount would not have crashed anything.**
  Traefik would have started cleanly and silently discovered no containers.
  Worth checking explicitly rather than trusting a clean startup.
- Traefik's flag parser is case-insensitive, so `entrypoint` vs `entryPoint`
  in the redirection flags makes no difference. The pattern doc is correct here.

## Follow-ups for `docs/deployment.md`

The pattern doc still describes the Hetzner path and needs reconciling with what
was actually built:

- Decisions table: Host row says "Single Hetzner VPS" / CX22. Should reflect
  DigitalOcean and note why (stock and no UK region at Hetzner).
- Runbook step 1 ("Provision the VPS") is Hetzner-specific.
- Add the swapfile step for boxes at or below 1 GB.
- Consider adding the "verify the pasted file" advice above - it cost the best
  part of an hour here. Better still, tell people to `curl` the compose file
  from the repo instead of pasting it (see step 9).
- Step 7 ("GHCR pull access") says "by default GHCR packages are private". Not
  true for the path this pattern uses: a package pushed with `GITHUB_TOKEN` from
  a public repo inherits the repo's visibility and is public immediately, so the
  whole step is a no-op here. It only applies to private repos, and the doc
  should say which case is which - the `docker login` advice is right, the
  "by default" framing sends you looking for a problem you don't have.
- The "add a new project" checklist should `chmod 600 .env` after writing it.
  `/opt` is `755`, so a project `.env` is world-readable by default. Harmless
  while `.env` is only `PORT` and root is the sole account, but the pattern is
  meant for projects whose `.env` carries a database URL or an API key, and the
  permissions are easier to get right at creation than to remember to fix later.
- The `deploy.yml` template's `script:` block needs `set -e`, or the `cd` needs
  `|| exit 1`. Confirmed on the first run here: `cd` failed on a missing
  directory and `docker compose pull` / `up -d` both ran regardless. Harmless
  only because no compose file happened to sit in `/root` - otherwise it would
  deploy the wrong stack, and could report success doing it.
- Worth a sentence on why `/opt/projects/<project>`, since the path is a
  contract between each repo's workflow and the box: it sits alongside
  `/opt/traefik` so one `ls` shows everything deployed, and staying out of
  `/root` means the eventual non-root `deploy` user is a `chown` rather than a
  path migration across every repo.
