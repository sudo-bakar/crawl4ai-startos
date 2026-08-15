import { i18n } from './i18n'
import { sdk } from './sdk'
import { storeJson } from './fileModels/store.json'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Crawl4AI'))

  // Reactive read of the auto-generated API token. Using .const(effects)
  // registers a dependency on store.json so that when setApiToken writes a
  // new token, StartOS rebuilds the daemon chain and the container restarts
  // with the new CRAWL4AI_API_TOKEN env var. (A .once() read would never
  // trigger the rebuild, leaving the running container on the old token.)
  const apiToken = await storeJson.read((s) => s.apiToken).const(effects)

  // The Playwright browsers are baked into the image under
  // /home/appuser/.cache/ms-playwright/ (chromium-<rev>/chrome-linux64/chrome
  // and chromium_headless_shell-<rev>/chrome-headless-shell-linux64/chrome-headless-shell,
  // both appuser-owned). Mounting the `cache` volume subpath at
  // /home/appuser/.cache would shadow those baked-in binaries with an empty
  // directory, causing `BrowserType.launch: Executable doesn't exist` and a
  // worker-boot failure — the web UI never came up. Only the artifact store
  // (outputs) is mounted; the baked-in browsers survive every boot with no
  // need to persist or re-download them.
  const mounts = sdk.Mounts.of().mountVolume({
    volumeId: 'main',
    subpath: 'outputs',
    mountpoint: '/var/lib/crawl4ai/outputs',
    readonly: false,
  })

  // 0.9.1 shipped without the chrome-headless-shell binary Playwright looks
  // for, and this package symlinked it to the full Chromium binary. Upstream
  // fixed the image in 0.9.2 (the Dockerfile now copies
  // chromium_headless_shell-* alongside chromium-* into appuser's cache), so
  // the workaround is gone and no rootfs mutation is needed here.
  return (
    sdk.Daemons.of(effects)
      // Re-chown the mounted `outputs` subpath to appuser before the server
      // starts. The image bakes this dir as 0700 / appuser-owned, but the
      // StartOS volume subpath lands owned by root. Runs as root so it can
      // chown. /home/appuser/.cache is intentionally not chowned here — it is
      // not mounted, so the baked-in appuser-owned directory is already
      // correct.
      .addOneshot('fix-permissions', {
        subcontainer: sdk.SubContainer.of(
          effects,
          { imageId: 'crawl4ai' },
          mounts,
          'crawl4ai-fixperms',
        ),
        exec: {
          command: [
            'sh',
            '-c',
            'chown -R appuser:appuser /var/lib/crawl4ai/outputs && chmod 700 /var/lib/crawl4ai/outputs',
          ],
          user: 'root',
        },
        requires: [],
      })
      .addDaemon('crawl4ai', {
        subcontainer: sdk.SubContainer.of(
          effects,
          { imageId: 'crawl4ai' },
          mounts,
          'crawl4ai-sub',
        ),
        exec: {
          // Run the image's bundled CMD (`bash entrypoint.sh`), which resolves
          // the gunicorn bind based on CRAWL4AI_API_TOKEN, then execs
          // supervisord. supervisord must be PID 1 → runAsInit.
          command: sdk.useEntrypoint(),
          runAsInit: true,
          env: {
            CRAWL4AI_API_TOKEN: apiToken ?? '',
            PYTHON_ENV: 'production',
          },
        },
        ready: {
          display: i18n('Web Interface'),
          fn: () =>
            sdk.healthCheck.checkWebUrl(
              effects,
              'http://localhost:11235/health',
              {
                successMessage: i18n('The web interface is ready'),
                errorMessage: i18n('The web interface is not ready'),
              },
            ),
        },
        requires: ['fix-permissions'],
      })
  )
})
