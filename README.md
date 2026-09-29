<p align="center">
  <img src="icon.svg" alt="Crawl4AI Logo" width="21%">
</p>

# Crawl4AI on StartOS

> Everything not listed in this document should behave the same as upstream
> Crawl4AI. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

Crawl4AI is an LLM-oriented web crawler and scraper. Its Docker server exposes a
REST API for crawling, screenshots, PDFs, and Markdown extraction, alongside a
playground, a live monitor, and Model Context Protocol endpoints. This package
runs that image unmodified and turns its API token into a StartOS action,
because the token is what decides whether the server is reachable at all.

- **Upstream repo:** <https://github.com/unclecode/crawl4ai>
- **Wrapper repo:** <https://github.com/Start9-Community/crawl4ai-startos>

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

One upstream image, run unmodified, with a permissions oneshot in front of it.

| Property      | Value                          |
| ------------- | ------------------------------ |
| Image         | `unclecode/crawl4ai`           |
| Architectures | x86_64, aarch64                |
| Command       | the image's own entrypoint     |
| Runtime user  | `appuser`, an unprivileged account |

| Subcontainer         | Purpose                                                |
| -------------------- | ------------------------------------------------------ |
| `crawl4ai-sub`       | The server — the one to `attach` to                    |
| `crawl4ai-fixperms`  | The `fix-permissions` oneshot; exits before the server |

The image's entrypoint resolves the gunicorn bind address from
`CRAWL4AI_API_TOKEN`, generates an ephemeral Redis password if none is supplied,
and then execs `supervisord`. Because supervisord has to be PID 1 to manage
gunicorn and the in-container Redis, the daemon runs with `runAsInit`.

A headless Chromium and its Playwright driver are baked into the image and are
deliberately not backed by a volume — there is nothing to persist and nothing to
download at boot.

Redis runs inside the container on loopback with a generated password, purely as
the server's job queue. Its port is never bound and its snapshots are discarded
at restart.

## Volume and Data Layout

One volume with two distinct tenants.

| Volume | Subpath / Mount Point                    | Purpose                          |
| ------ | ---------------------------------------- | -------------------------------- |
| `main` | `outputs` → `/var/lib/crawl4ai/outputs`  | Screenshot and PDF artifact store |
| `main` | `store.json` at the volume root          | The API token                     |

**The artifact store is a cache, not storage.** Upstream expires each artifact
an hour after it is written, caps the directory at 2 GiB, and reaps oldest-first
when it goes over — by a janitor task and again on read, which unlinks an
expired file and reports it missing. `/screenshot` and `/pdf` hand back an id
the caller is expected to fetch promptly. Mounting the directory keeps its quota
off the container's ephemeral layer and gives it stable ownership across
rebuilds; it does not make an artifact durable.

StartOS hands the mounted subpath over root-owned on every start while the
server writes it as `appuser`, which is what the `fix-permissions` oneshot
corrects before the daemon runs.

## File Models

One model, holding a credential the application does not manage itself.

| Model        | File                          | Format |
| ------------ | ----------------------------- | ------ |
| `store.json` | `store.json` on `main`'s root | JSON   |

It holds one key, `apiToken`, written only by the **Set API Token** action and
read reactively by the daemon as `CRAWL4AI_API_TOKEN`. Nothing else writes it,
so it survives restarts and updates, and a backup restores it with the volume.
The read is reactive rather than one-shot, so rotating the token restarts the
container onto the new value with no manual step.

The application's own `config.yml` is baked into the image and left untouched.
Its `trusted_hosts` accepts any Host header the StartOS proxy sets, and its
Chromium flags already suit an unprivileged container, so there is no
configuration file for a user to edit and no hand edit to survive.

## Dependencies

None. Crawling needs outbound DNS and HTTP access to whatever the user points it
at; LLM-backed extraction additionally needs a provider key, which this package
does not expose — see [Limitations](#limitations-and-differences).

## Network Access and Interfaces

One interface carrying everything.

| Interface     | Id    | Type | Port  | Description                                     |
| ------------- | ----- | ---- | ----- | ----------------------------------------------- |
| Web Interface | `web` | ui   | 11235 | Playground, REST API, monitor, and MCP endpoints |

The interface opens on the playground; the REST API, the monitor's WebSocket,
and the MCP endpoints all sit at the root of the same address. The API requires
the token as an `Authorization: Bearer` header — but **the pages themselves do
not**. `/playground/`, `/dashboard/` and `GET /health` are served to anyone who
can reach the address; `/docs`, `/metrics`, `/hooks/info` and every crawl
endpoint answer `401` without it. So an unauthenticated visitor gets the UI
shell and nothing it can do.

The path carries a trailing slash deliberately. Uvicorn redirects the bare
`/playground` to `/playground/`, and it builds that redirect from the plaintext
request StartOS proxies to it — so the browser is handed an `http://` URL on the
TLS port and the connection is refused. Addressing the directory directly skips
the redirect. `/dashboard/` has the same shape.

The MCP server offers two transports with different credential rules. The SSE
transport requires the Bearer header on both the event stream and the JSON-RPC
POSTs. The WebSocket transport also accepts the token as a `token` query
parameter, for clients that cannot set headers — upstream scopes that fallback
to WebSocket connections only, so an SSE client sending `?token=` is rejected
before the stream opens and then hangs until it times out.

## Installation and First-Run Flow

**The service is unreachable until the API token is set**, and that is the whole
of the first-run flow. Without a credential the image's entrypoint binds
gunicorn to loopback, which is upstream's secure default and means the StartOS
proxy has nothing to connect to. A `critical` task raised at install points at
the action that fixes it.

The token is not generated at install because it is the user's credential and
has to be shown to them once, which only an action can do.

## Actions

One action, used once for setup and thereafter for rotation.

**Set API Token** (`set-api-token`)

- **When to run it** — at install, when the critical task asks for it; later,
  whenever the token should be rotated or has been lost.
- **What it changes** — the `apiToken` key in `store.json`, and through it the
  daemon's environment.
- **Cost** — a container restart, a few seconds.
- **Repeat safety** — safe to repeat, but not idempotent: every run mints a new
  token and invalidates the old one. Every client has to be updated.
- **What happens next** — the daemon restarts on the new token and the web
  interface health check goes green again.
- **Outputs** — the token itself, masked and copyable. It is shown once per run;
  losing it means rotating again.

## Tasks

One task, and it blocks startup by design.

| Task          | Severity   | Raised by                     | Cleared by             |
| ------------- | ---------- | ----------------------------- | ---------------------- |
| Set API Token | `critical` | Init, whenever no token is stored | Running the action |

Being `critical`, it suspends the service's ordinary controls until it is
satisfied — which is correct here, because a service with no token cannot be
reached even if it were started. The condition is re-evaluated reactively, so
writing the token clears the task without a restart, and the task does not
return unless the store is emptied.

## Health Checks

One check, on the server daemon.

| Check      | Displayed       | Method                    | Grace |
| ---------- | --------------- | ------------------------- | ----- |
| `crawl4ai` | "Web Interface" | `GET /health`             | 60 s  |

`/health` is the one route exempt from authentication, so the check works before
any client is configured. The generous grace period covers gunicorn starting its
workers and Chromium initializing. A failure that persists past it means a
worker failed to boot — the service logs carry the Python traceback, and a
browser that cannot launch is the usual cause.

## Backups and Restore

The `main` volume is copied wholesale — `sdk.Backups.ofVolumes('main')`.

What that is worth is almost entirely `store.json`: restoring it brings the
install back on the same API token, so existing clients keep working. The
`outputs` directory is copied too, but its contents expire an hour after they
are written, so any restore performed later than that recovers an empty
directory. Chromium and the Playwright driver are in the image's read-only
layers and are never part of a backup.

## Limitations and Differences

1. **No LLM provider can be configured.** The `/llm` endpoint and LLM-backed
   extraction need a provider key that this package does not expose. In `/md`,
   only `f: "raw"` avoids provider resolution; `fit`, `bm25`, and `llm` may fail
   without one.
2. **JavaScript execution and crawl hooks are off.** Upstream gates both behind
   opt-in settings this package does not surface, so `/execute_js` and crawls
   carrying hooks are refused. `/hooks/info` still answers.
3. **Rate limiting counts the proxy, not the client.** Upstream's trusted-proxy
   list is empty, so every request appears to come from the StartOS reverse
   proxy and the limit is shared across all callers rather than applied per
   client.
4. **Artifacts expire after an hour and the limit cannot be changed.** That is
   upstream's default; the package exposes no override, so screenshots and PDFs
   must be downloaded promptly.
5. **A crawl is cancelled after five minutes.** Upstream's default per-request
   deadline (`limits.wall_clock_s`) is 300 seconds, and a request that exceeds
   it fails with a `504` instead of returning partial results. Synchronous
   requests and background jobs share the same handler, so both are subject to
   it. Larger jobs have to be split.
6. **The playground and monitor are not self-contained, and load third-party
   scripts with no integrity pinning.** Upstream builds both pages from
   CodeMirror, highlight.js and clipboard.js on `cdnjs.cloudflare.com`,
   Tailwind's runtime compiler on `cdn.tailwindcss.com`, and a webfont from
   Google — none of it vendored, and **not one tag carries an `integrity`
   hash**. Three consequences: a browser that cannot reach those hosts stalls on
   a blank page; one that can has told Cloudflare and Google it opened a
   Crawl4AI playground (the page sets `Referrer-Policy: no-referrer`, so they do
   not learn the address); and the API token the user pastes in, which the page
   keeps in `sessionStorage` as `crawl4ai_token`, sits in an origin executing
   four unpinned third-party scripts. Anything those hosts return runs with
   access to it. The package cannot correct this without replacing upstream's
   HTML. The REST and MCP surfaces are unaffected — nothing outside the browser
   touches a CDN.
7. **The icon is a local rendering.** Upstream publishes no vector form of its
   logo, so `icon.svg` is drawn to match rather than taken from the project.

---

## Quick Reference for AI Consumers

```yaml
package_id: crawl4ai
image: unclecode/crawl4ai
architectures:
  - x86_64
  - aarch64
subcontainers:
  - crawl4ai-sub # the server
  - crawl4ai-fixperms # oneshot, exits before the server starts
volumes:
  main: /var/lib/crawl4ai/outputs # subpath `outputs`; store.json at the root
file_models:
  - store.json
startos_managed_env_vars:
  - CRAWL4AI_API_TOKEN
  - PYTHON_ENV
dependencies: []
interfaces:
  web: { type: ui, port: 11235 }
actions:
  - set-api-token
tasks:
  - { action: set-api-token, severity: critical }
health_checks:
  - crawl4ai # displayed "Web Interface"
```
