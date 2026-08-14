# Deployment progress log

Working log for the first run of the pattern in `docs/deployment.md`. foodeals is
the proving ground, so this records what actually happened - including where the
pattern doc turned out to be wrong or incomplete.

**Status: step 8 of 10.** The box is provisioned and serving and the deploy key
is in place; what remains is committing the deploy files, the box project
directory, and the first deploy.

Last updated: 2026-08-14.

## Decisions taken during setup

| Decision     | Choice                       | Why                                                                                                                |
| ------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Host         | DigitalOcean, not Hetzner    | Hetzner had no CX stock and no CAX stock; CPX started at EUR 11.99. DO also has a London region.                   |
| Droplet size | $6/mo, 1 vCPU / 1 GB / 25 GB | Box only runs containers (builds happen in CI). Resizing RAM/CPU upward later is reversible on DO.                 |
| Database     | Not on the box               | Postgres would take 150-250 MB of the ~570 MB free. Use a managed provider (Neon etc.) per the doc's escape hatch. |
| Swap         | 1 GB swapfile added          | Not in the pattern doc, which assumed a 4 GB box. Cheap insurance against the OOM killer on 1 GB.                  |
| CI gating    | None for now                 | Deploy workflow only. `ci.yml` stays on ROADMAP.                                                                   |
| `SSH_USER`   | `root`                       | Simplest. Trade-off: Actions secrets compromise = box compromise. A non-root `deploy` user is the tighter option.  |
| GHCR access  | Public package, no box login | Keeps credentials off the box. The image holds no secrets. Cost: the first deploy fails at `pull` (see step 10).   |

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

## Remaining

### Step 8 - commit and push the deployment files

`docker-compose.yml` and `.github/workflows/deploy.yml` match
`docs/deployment.md`'s templates verbatim (image `ghcr.io/glynl/foodeals:latest`,
host `foodeals.glynlewington.com`). `ROADMAP.md` moves them out of
"Ideas / maybe" into "Done" in the same commit.

Pushing fires the deploy workflow immediately, and **run 1 is expected to fail**
for two reasons at once: `/opt/projects/foodeals` doesn't exist yet (step 9) and
the GHCR package is private (step 10). Push anyway - step 9's `curl` route needs
the compose file to be on `main` first, and that beats pasting it into the
console.

### Step 9 - box project directory

CI never copies these; the deploy job only runs `docker compose pull && up -d`
in that directory, so both files must already exist on the box.

Fetch the compose file rather than pasting it - `curl` can't be mangled by the
browser console, and the file is already on `main` after step 8:

```sh
mkdir -p /opt/projects/foodeals && cd /opt/projects/foodeals
curl -fsSL -o docker-compose.yml \
  https://raw.githubusercontent.com/GlynL/foodeals/main/docker-compose.yml
printf 'PORT=3000\n' > .env
docker compose config   # proves the paste/fetch is intact and PORT interpolated
```

`raw.githubusercontent.com` only works for a public repo. If the repo is
private, paste the file instead and verify it with `docker compose config`.

### Step 10 - first deploy

The build and GHCR push succeed on run 1; only `Deploy over SSH` fails. A new
GHCR package is private by default, and it doesn't exist until that first build
pushes it, so it can't be made public in advance.

1. Make the package public: GitHub -> your profile -> Packages -> `foodeals` ->
   Package settings -> Change visibility -> Public.
2. Re-run the failed job from the Actions run page. No new commit needed, and by
   now step 9 has created the directory the job `cd`s into.

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
- Step 7 ("GHCR pull access") reads as a one-time box setup step, but the
  public-package route can't be done before the first push: the package doesn't
  exist until the first build creates it. Say so, and say that the first deploy
  run therefore fails at `pull` unless the box logs in with a PAT up front.
