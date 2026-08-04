import { mkdir, symlink, unlink } from 'node:fs/promises'
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

  // The Playwright Chromium binary is baked into the 0.9.1 image at
  // /home/appuser/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome
  // (appuser-owned). Mounting the `cache` volume subpath at
  // /home/appuser/.cache would shadow that baked-in binary with an empty
  // directory, causing `BrowserType.launch: Executable doesn't exist` and a
  // worker-boot failure — the web UI never came up. Only the artifact store
  // (outputs) is mounted; the baked-in Chromium survives every boot with no
  // need to persist or re-download it.
  const mounts = sdk.Mounts.of().mountVolume({
    volumeId: 'main',
    subpath: 'outputs',
    mountpoint: '/var/lib/crawl4ai/outputs',
    readonly: false,
  })

  // The 0.9.1 image bakes the full Chromium binary (chromium-1228) but
  // Playwright in 0.9.1 looks for the separate chrome-headless-shell-1228
  // binary, which upstream forgot to `playwright install` in the image.
  // Without this workaround, gunicorn's UvicornWorker crashes during FastAPI
  // startup with `BrowserType.launch: Executable doesn't exist at
  // .../chrome-headless-shell` and supervisord restarts it forever — the
  // service never reaches `ready`. The full Chromium binary accepts
  // --headless=new, so a symlink from the expected path to the existing
  // binary is sufficient. Remove this workaround when a fixed image ships.
  const crawl4aiSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'crawl4ai' },
    mounts,
    'crawl4ai-sub',
  )
  const headlessShellDir = `${crawl4aiSub.rootfs}/home/appuser/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64`
  await mkdir(headlessShellDir, { recursive: true })
  await unlink(`${headlessShellDir}/chrome-headless-shell`).catch(() => {})
  await symlink(
    '/home/appuser/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome',
    `${headlessShellDir}/chrome-headless-shell`,
  )

  return (
    sdk.Daemons.of(effects)
      // Re-chown the mounted `outputs` subpath to appuser before the server
      // starts. The image bakes this dir as 0700 / appuser-owned, but the
      // StartOS volume subpath lands owned by root. Runs as root so it can
      // chown. /home/appuser/.cache is intentionally not chowned here — it is
      // not mounted, so the baked-in appuser-owned directory is already
      // correct.
      .addOneshot('fix-permissions', {
        subcontainer: await sdk.SubContainer.of(
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
        subcontainer: crawl4aiSub,
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
