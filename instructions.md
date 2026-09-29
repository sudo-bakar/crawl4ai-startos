# Crawl4AI

Crawl4AI will not accept connections until you set its API token. That is the
first thing to do after installing, and StartOS will prompt you for it.

## Documentation

- [Crawl4AI self-hosting guide](https://docs.crawl4ai.com/core/self-hosting/) — every endpoint the server exposes and what it returns.
- [Upstream README](https://github.com/unclecode/crawl4ai#readme) — feature overview and quick-start.

## What you get on StartOS

One web address that serves all of it:

- **A playground** for trying crawls, screenshots, PDFs, and Markdown
  extraction from the browser.
- **A REST API** for the same operations from your own code.
- **A live monitor** showing active crawls, queues, and statistics.
- **MCP endpoints**, so an AI assistant such as Claude Code can crawl through
  this server as a tool.

A headless browser is bundled, so there is nothing to download and pages that
need JavaScript render properly.

## Getting set up

1. Open the service from your Dashboard. It will be showing a **Set API Token**
   task — run it.
2. **Copy the token it gives you.** It is shown once. Every request you make
   from now on needs it, and if you lose it your only option is to run the
   action again and update everything that used the old one.
3. Wait for the **Web Interface** health check to go green. The service restarts
   with the token applied, which takes a few seconds.
4. Check that the token works:

   ```bash
   curl -H "Authorization: Bearer <your-token>" <address>/hooks/info
   ```

   A valid token returns a list of hook actions. (`/health` answers without a
   token, so it confirms the service is up but tells you nothing about the
   token.)

Throughout the rest of this page, `<address>` means the **Web Interface**
address StartOS shows you, minus the trailing `/playground/` it opens on.

## Using Crawl4AI

### Playground

The **Web Interface** link opens the playground. Paste your token into its token
field, and you can run any of the crawl, screenshot, PDF, and Markdown
operations from the browser without writing a request. The monitor lives at
`<address>/dashboard/` and uses the same token.

**Both pages need internet access from the device you are browsing on.**
Crawl4AI builds them from stylesheets and scripts hosted on Cloudflare's CDN and
Google Fonts rather than serving its own, so on a machine that cannot reach
those the page stalls while loading and never finishes. That is upstream's
design and nothing in StartOS can supply the files locally. The REST API and the
MCP endpoints below have no such dependency and work regardless.

Because of that, treat the token you paste into the page as exposed to those
providers: the page runs their code alongside it. If that matters to you, use
the API directly and leave the playground alone.

### REST API

Send `Authorization: Bearer <your-token>` on every request except `/health`. A
minimal crawl:

```bash
curl -X POST \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://example.com"]}' \
  <address>/crawl
```

### Connecting an AI assistant

Two Model Context Protocol transports are available on the same address, and
they authenticate differently:

| Transport | URL                     | How to authenticate                                                     |
| --------- | ----------------------- | ----------------------------------------------------------------------- |
| SSE       | `<address>/mcp/sse`     | `Authorization: Bearer <your-token>` header, on both the stream and the POSTs |
| WebSocket | `<address>/mcp/ws`, with a `ws://` or `wss://` scheme | the same header, or `?token=<your-token>` in the URL |

Configure the header if your client can set one. **Do not put `?token=` on the
SSE URL** — it is rejected, and the symptom is a client that hangs rather than
one that reports an error. If your client cannot set headers at all, use the
WebSocket transport.

### Screenshots and PDFs expire

When you call `/screenshot` or `/pdf`, the server saves the file and hands you an
id to fetch it with. **It deletes that file an hour later**, and deletes the
oldest files early if the store passes 2 GB. This is Crawl4AI's own behavior and
there is no setting here to change it — download anything you want to keep as
soon as you have its id, and do not treat the server as storage.

### Actions

- **Set API Token** — generates a new token and shows it to you once. Run it
  from the **Actions** tab whenever you want to rotate it; every client using
  the old token stops working immediately.

## Limitations

- **AI-powered extraction needs a provider key that cannot be set here.** The
  `/llm` endpoint, LLM extraction, and the `fit`, `bm25`, and `llm` modes of
  `/md` may fail. Use `/md` with `{"f":"raw"}` for extraction that needs no
  provider.
- **`/execute_js` and crawl hooks are turned off** and return an error. The
  `/hooks/info` endpoint still works.
- **A crawl is cancelled after five minutes** and fails with a timeout instead
  of returning partial results. Split large jobs into smaller ones.
- **The playground and monitor load their interface from Cloudflare's CDN and
  Google Fonts.** They will not render on a device without internet access, and
  opening them tells those providers you did. The API is unaffected.
- **The two pages are readable by anyone who can reach the address**, with no
  token. They show nothing on their own — every button behind them needs the
  token — but if that bothers you, keep the service on addresses you trust.
