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
| Entrypoint | Upstream `bash entrypoint.sh` is run as PID 1 (`sdk.useEntrypoint()` + `runAsInit: true`). It resolves the gunicorn bind from `CRAWL4AI_API_TOKEN`, generates an ephemeral Redis password if absent, then `exec`s `supervisord -c supervisord.conf --pidfile /tmp/supervisord.pid`. |
| Init system | supervisord (foreground, `nodaemon=true`) manages gunicorn + the in-container Redis |
| Runtime user | `appuser` (UID/GID `999`, a system user created with `groupadd -r appuser && useradd --no-log-init -r -g appuser appuser`). The image's `USER appuser` directive, an unprivileged system account. |

The image pins an in-container Redis (loopback-only, password-protected) for
its job queue. Its port (6379) is never published and is not exposed by this
package.

## Volume and Data Layout

| Volume | Subpath → Mount point | Purpose |
|---|---|---|
| `main` | `outputs` → `/var/lib/crawl4ai/outputs` | Screenshot / PDF artifact store (mode `0700`, `appuser`-owned) |
| `main` | `store.json` (root of volume) | Package-internal JSON file holding the auto-generated API token |

The Playwright Chromium binary is **baked into the Docker image** at
`/home/appuser/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`
(appuser-owned) and is deliberately **not** mounted as a volume. Mounting a
volume subpath at `/home/appuser/.cache` would shadow that baked-in binary
with an empty directory, causing `BrowserType.launch: Executable doesn't
exist` and a gunicorn worker-boot failure. Since the image bundles Chromium,
there is nothing to persist or re-download; it is present on every boot.

The 0.9.1 image ships a regression: it bakes the full `chromium-1228` binary
but Playwright in 0.9.1 looks for the separate `chromium_headless_shell-1228`
binary, which upstream forgot to `playwright install`. This package patches
the daemon's subcontainer rootfs before startup, symlinking the missing
`chrome-headless-shell` path to the existing full Chromium binary (which
accepts `--headless=new`). The symlink is created in `setupMain` on every
boot — no volume or persisted state is involved. Remove this workaround when
a fixed upstream image ships.

A `fix-permissions` oneshot runs as `root` before the main daemon starts on
every start, restoring ownership of the mounted `outputs` subpath to
`appuser`. The StartOS volume subpath lands owned by the container's `root`,
but the image's runtime expects `outputs/` to belong to `appuser` — without
this oneshot the server cannot write artifacts after a restart.

Redis persistence is enabled (RDB snapshots write to `/var/lib/redis`,
writable by `appuser`) but `/var/lib/redis` is intentionally not mounted as
a volume — the data is ephemeral and discarded each restart.

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
| | Feature opt-ins such as `CRAWL4AI_EXECUTE_JS_ENABLED` and `CRAWL4AI_HOOKS_ENABLED` — not exposed by this package |

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
| `web` | `11235` | `80` (preferred; dynamically assigned if taken) | HTTP | Single surface for playground UI, REST API, dashboard, and MCP endpoints. The StartOS "Open" button lands on `/playground`. |

All endpoints (`/playground`, `/dashboard`, `/crawl`, `/screenshot`, `/pdf`,
`/execute_js`, `/md`, `/llm`, `/schema`, `/health`, `/metrics`, `/hooks/info`,
the monitor WebSocket `/monitor/ws`, and the MCP endpoints `/mcp/sse` +
`/mcp/ws`) live on the single port at the **root** of the service address.

The base URL depends on how StartOS assigned the external port: if port 80 was
available, the service is reverse-proxied on the dashboard host under the
`/crawl4ai/` path prefix (e.g. `https://<host>.local/crawl4ai/playground`); if
port 80 was taken, StartOS assigns a dedicated external port and serves the
service at the root of its own `host:port` address (e.g.
`https://<host>:<port>/playground`) with no path prefix. The exact address is
shown on the service's StartOS dashboard page — use that as the base URL and
append the endpoint paths from this document.

The MCP server is exposed on the single `web` interface under `/mcp/…`. Two
transports are present, with **different credential requirements**:

| Transport | Path | Auth |
|---|---|---|
| SSE | `/mcp/sse` (GET stream) + `/mcp/messages/?session_id=…` (JSON-RPC POST) | `Authorization: Bearer <token>` header |
| WebSocket | `/mcp/ws` | `?token=<token>` query **or** `Authorization: Bearer` header |

The `?token=` query form is honored **only on the WebSocket transport**.
Upstream's `AuthGate` (`auth_gate.py:_extract_token`) keys `?token=` extraction
behind `scope["type"] == "websocket"`, so an HTTP request to `/mcp/sse` carrying
`?token=` instead of a Bearer header is rejected with `401` before the SSE
stream opens — the client then hangs to its call timeout. The 0.9.0 migration
guide scopes `?token=…` to "WebSocket clients (MCP, monitor) that can't set
headers", not to the SSE path.

Accordingly, an SSE MCP client **must** send `Authorization: Bearer <token>` on
both the GET stream and the JSON-RPC POST; the package does not (and cannot)
relay a `?token=` query into a header for HTTP. Clients that genuinely cannot
set headers must use `/mcp/ws?token=<token>`.

The SSE transport is a dual-flow design: the JSON-RPC reply to a POST
(initialize / tools/list / call) is delivered **back over the open GET SSE
stream**, not in the POST's `202` response. The GET stream must stay open for
the session's lifetime — if it closes, the MCP SDK pops the session and further
POSTs to `/mcp/messages/?session_id=…` return `404 "Could not find session"`
(per `mcp.server.sse.SseServerTransport.handle_post_message`; gunicorn runs
`--workers 1` so this is not a multi-worker affinity issue). There is no
streamable-HTTP `/mcp` endpoint in crawl4ai `0.9.0` or current `main` — only
`/mcp/sse` and `/mcp/ws` are mounted (`mcp_bridge.py:252,197`).

The reverse-proxy path prefix depends on how the interface is reached: via the
StartOS dashboard host the service is mounted under `/crawl4ai/…`, while the
interface's dedicated external host:port serves it at root (`/mcp/sse`).

## Actions (StartOS UI)

| Action | Purpose | Visibility |
|---|---|---|
| **Set API Token** | Generate (or rotate) the `CRAWL4AI_API_TOKEN`. Returns the token once, masked but copyable. Re-running rotates it. | `enabled` — visible in the Actions tab for both initial setup and rotation |

## Backups and Restore

The entire `main` volume is backed up — that captures `outputs/`
(screenshots / PDFs the user expects to keep) and `store.json` (the API token
at the volume root, so a restored-from-backup install keeps the same token).
The Playwright Chromium binary is **not** part of any volume: it lives in the
Docker image's read-only layer, so it adds nothing to backup size and is
restored automatically whenever the image is present.

## Health Checks

| Check | Endpoint | Notes |
|---|---|---|
| Daemon `ready` | `GET http://localhost:11235/health` | `200 OK` with `{"status":"ok",...}`. Upstream's `/health` is exempt from auth. The StartOS `checkWebUrl` helper is used (more precise than `checkPortListening`). |

The upstream Dockerfile's own `HEALTHCHECK` additionally asserts
`free -m >= 2048` and `redis-cli ping`; StartOS does not replicate these in
its daemon `ready` check because the OS already enforces the 2 GB minimum RAM
as a `hardwareRequirements` install floor (see the manifest).

## Dependencies

None.

## Limitations and Differences

1. **LLM provider API keys are not yet configurable.** The `/llm` endpoint and
   LLM-backed extraction require a provider key. In the pinned server's `/md`
   implementation, only `f: "raw"` avoids provider resolution; `fit`, `bm25`,
   and `llm` may fail without a configured provider even though the underlying
   fit and BM25 filters are LLM-free. A follow-up release should expose
   provider configuration and retest each mode.
2. **JavaScript execution and declarative crawl hooks are disabled.** Upstream
   requires `CRAWL4AI_EXECUTE_JS_ENABLED=true` and
   `CRAWL4AI_HOOKS_ENABLED=true` respectively. This package does not expose
   those opt-ins, so `/execute_js` and crawl requests containing hooks return
   `403`. `/hooks/info` remains available and authenticated.
3. **Rate-limit trusted-proxies not configured.** Upstream's
   `rate_limiting.trusted_proxies: []` is left empty, so rate limiting keys
   on the StartOS proxy IP (`10.0.3.1`) rather than each real client. Rate
   limiting still functions; v2 can mount a `config.yml` override listing
   `10.0.3.1` for correct per-client accounting.
4. **`icon.svg` ships an embedded raster.** Upstream has no vector form of
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
  main: /var/lib/crawl4ai/outputs
# Note: Playwright Chromium is baked into the image (not a mounted volume)
ports:
  web: 11235
dependencies: []
startos_managed_env_vars:
  - CRAWL4AI_API_TOKEN
actions:
  - set-api-token
```
