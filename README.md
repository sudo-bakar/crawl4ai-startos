<p align="center">
  <img src="icon.svg" alt="Crawl4AI Logo" width="21%">
</p>

# Crawl4AI on StartOS

> **Upstream docs:** <https://docs.crawl4ai.com/>
>
> Everything not listed in this document should behave the same as upstream
> Crawl4AI. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable.

Crawl4AI is an open-source, LLM-friendly web crawler and scraper. The upstream
Docker image bundles a Gunicorn HTTP server that exposes a REST API, a
playground UI, a real-time monitor, and Model Context Protocol (MCP)
endpoints. This package wraps the prebuilt image verbatim and surfaces its
single HTTP port through the StartOS reverse proxy.

Upstream project: <https://github.com/unclecode/crawl4ai>

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Configuration Management](#configuration-management)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Actions (StartOS UI)](#actions-startos-ui)
- [Backups and Restore](#backups-and-restore)
- [Health Checks](#health-checks)
- [Dependencies](#dependencies)
- [Limitations and Differences](#limitations-and-differences)
- [What Is Unchanged from Upstream](#what-is-unchanged-from-upstream)
- [Contributing](#contributing)

---

## Image and Container Runtime

| What | Value |
|---|---|
| Image source | Upstream `unclecode/crawl4ai` Docker image, unmodified |
| Architectures | `x86_64`, `aarch64` |
| Entrypoint | Upstream `bash entrypoint.sh` is run as PID 1 (`sdk.useEntrypoint()` + `runAsInit: true`). It resolves the gunicorn bind from `CRAWL4AI_API_TOKEN`, generates an ephemeral Redis password if absent, then `exec`s `supervisord -c supervisord.conf`. |
| Init system | supervisord (foreground, `nodaemon=true`) manages gunicorn + the in-container Redis |
| Runtime user | `appuser` (the image's `USER appuser` directive, an unprivileged system account) |

The image pins an in-container Redis (loopback-only, password-protected) for
its job queue. Its port (6379) is never published and is not exposed by this
package.

## Volume and Data Layout

| Volume | Subpath → Mount point | Purpose |
|---|---|---|
| `main` | `outputs` → `/var/lib/crawl4ai/outputs` | Screenshot / PDF artifact store (mode `0700`, `appuser`-owned) |
| `main` | `cache` → `/home/appuser/.cache` | Playwright Chromium browser binaries (hundreds of MB) |
| `main` | `store.json` (root of volume) | Package-internal JSON file holding the auto-generated API token |

A `fix-permissions` oneshot runs as `root` before the main daemon starts on
every start, restoring ownership of the two mounted subpaths to `appuser`. The
StartOS volume root is owned by the container's `root`, but the image's runtime
expects those directories to belong to `appuser` — without this oneshot the
server cannot write artifacts or re-use the cached browser binaries after a
restart.

Redis data (`/var/lib/redis`, `/var/log/redis`) is intentionally **not**
mounted — it is ephemeral and regenerated each restart by the entrypoint.

## Installation and First-Run Flow

The package does **not** auto-generate the API token at install time, because
the token is the user's primary credential — it must be seen once. Instead:

1. A `setupOnInit` watcher checks `store.json` for `apiToken`. When absent, it
   surfaces a **critical task** in the UI pointing at the **Set API Token**
   action. The service cannot become reachable through the StartOS proxy until
   this is run, because the upstream entrypoint binds gunicorn to loopback
   only when no credential is present (its secure-by-default behavior).
2. The user runs the **Set API Token** action. It generates a 64-character
   random token, persists it to `store.json`, returns it as a copyable masked
   value, and triggers a daemon rebuild so the new token takes effect.
3. The token is sent as `Authorization: Bearer <token>` on every API request
   (only `GET /health` is exempt). The static token is admin-scope, which is
   appropriate since the user is the operator.

Re-running the **Set API Token** action rotates the token; the daemon restarts
and the new token replaces the old one.

## Configuration Management

| StartOS-Managed | Upstream-Managed |
|---|---|
| `CRAWL4AI_API_TOKEN` env var (auto-generated, persisted in `store.json`, read reactively by `setupMain`) | `/app/config.yml` (baked into the image, not mounted) |
| HTTP interface port (`11235` → external `80` via the StartOS proxy) | LLM provider API keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.) — not yet wired through StartOS; see [Limitations](#limitations-and-differences) |

The upstream `config.yml` is left untouched. Its `security.trusted_hosts:
["*"]` accepts any Host header the StartOS proxy injects, and
`crawler.browser.extra_args` already includes `--no-sandbox`,
`--disable-dev-shm-usage`, `--disable-gpu`, and
`--disable-software-rasterizer` — all appropriate for a non-root StartOS
subcontainer with no `/dev/shm` override. Mounting a replacement `config.yml`
for v1 was deliberately avoided: a mount completely replaces the file, and
the baked-in default is already correct once the token is set.

## Network Access and Interfaces

| Interface | Internal port | External port | Protocol | Purpose |
|---|---|---|---|---|
| `web` | `11235` | `80` (preferred) | HTTP | Single surface for playground UI, REST API, monitor, and MCP endpoints |

Reaching the API at `https://<startos-host>.local/crawl4ai/...` works for
every endpoint. The `/playground`, `/monitor`, `/crawl`, `/screenshot`,
`/pdf`, `/execute_js`, `/md`, `/llm`, `/schema`, `/health`, `/metrics`,
`/hooks/info`, the monitor WebSocket `/monitor/ws`, and the MCP endpoints
`/mcp/sse` + `/mcp/ws` all live on the single port.

The MCP server URL is `https://<startos-host>.local/crawl4ai/mcp/sse?token=<token>`
when pointed at an MCP client that can't set headers (the `?token=` query
form is supported by upstream's 0.9.0 migration guide).

## Actions (StartOS UI)

| Action | Purpose | Visibility |
|---|---|---|
| **Set API Token** | Generate (or rotate) the `CRAWL4AI_API_TOKEN`. Returns the token once, masked but copyable. Re-running rotates it. | `enabled` — visible in the Actions tab for both initial setup and rotation |

## Backups and Restore

The entire `main` volume is backed up — that captures both `outputs/`
(screenshots / PDFs the user expects to keep) and `cache/` (the Playwright
Chromium binaries, ~500 MB). If `cache/` bloats backups unacceptably, a
follow-up release can switch to incremental rsync excluding `cache/`
(`recipe-backups.md`). `store.json` (the API token) lives at the volume root
and is restored with it, so a restored-from-backup install keeps the same
token.

## Health Checks

| Check | Endpoint | Notes |
|---|---|---|
| Daemon `ready` | `GET http://localhost:11235/health` | `200 OK` with `{"status":"healthy",...}`. Upstream's `/health` is exempt from auth. The StartOS `checkWebUrl` helper is used (more precise than `checkPortListening`). |

The upstream Dockerfile's own `HEALTHCHECK` additionally asserts
`free -m >= 2048` and `redis-cli ping`; StartOS does not replicate these in
its daemon `ready` check because the OS already enforces the 2 GB minimum RAM
as a `hardwareRequirements` install floor (see the manifest).

## Dependencies

None.

## Limitations and Differences

1. **LLM provider API keys are not yet configurable.** The `/md` and `/llm`
   extraction endpoints (and any LLM-tagged `LLM_PROVIDER` / `LLM_BASE_URL`
   behaviours) return an error until provider keys are present in the
   container's environment. All non-LLM endpoints (`/crawl`, `/html`,
   `/screenshot`, `/pdf`, `/execute_js`, `/playground`) work without keys. A
   follow-up release will add a config action for pasting LLM provider keys.
2. **Rate-limit trusted-proxies not configured.** Upstream's
   `rate_limiting.trusted_proxies: []` is left empty, so rate limiting keys
   on the StartOS proxy IP (`10.0.3.1`) rather than each real client. Rate
   limiting still functions; v2 can mount a `config.yml` override listing
   `10.0.3.1` for correct per-client accounting.
3. **`icon.svg` ships an embedded raster.** Upstream has no vector form of
   the Crawl4AI logo — the StartOS icon embeds the upstream 32×32 PNG
   (`deploy/docker/static/assets/crawl4ai-logo.png`) inside an SVG
   `<image>`. There is no fabricated vector artwork.

## What Is Unchanged from Upstream

- The Docker image, including its `supervisord` init chain and `entrypoint.sh`
  bind-resolution behavior
- The default `/app/config.yml` (model paths, Chromium flags, JWT disabled,
  `trusted_hosts: ["*"]`)
- Internal Redis (loopback-only, password-protected) — not exposed, not
  persisted, password regenerated each start
- The full REST API surface, playground, real-time monitor, and MCP endpoints
- The 2 GB hard-minimum RAM requirement (enforced by upstream's own
  HEALTHCHECK and re-exposed here via the manifest)

## Contributing

See [`AGENTS.md`](./AGENTS.md) for the workspace packaging context and
conventions.

---

## Quick Reference for AI Consumers

```yaml
package_id: crawl4ai
architectures:
  - x86_64
  - aarch64
volumes:
  main: /var/lib/crawl4ai/outputs (and /home/appuser/.cache)
ports:
  web: 11235
dependencies: []
startos_managed_env_vars:
  - CRAWL4AI_API_TOKEN
actions:
  - set-api-token
```
