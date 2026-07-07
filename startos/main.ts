import { i18n } from './i18n'
import { sdk } from './sdk'
import { storeJson } from './fileModels/store.json'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Crawl4AI'))

  // Reactive read — the daemon chain rebuilds if the token changes, which is
  // exactly what we want: entrypoint.sh resolves the gunicorn bind at boot,
  // so a token rotation only takes effect after a restart.
  const apiToken = await storeJson.read((s) => s.apiToken).const(effects)

  // The two persisted paths the image writes to. Mounting over them replaces
  // the (correctly-owned) baked-in dirs with the StartOS volume's root-owned
  // subpaths, so the chown oneshot below re-grants ownership to appuser on
  // first boot and after restore.
  const mounts = sdk.Mounts.of()
    .mountVolume({
      volumeId: 'main',
      subpath: 'outputs',
      mountpoint: '/var/lib/crawl4ai/outputs',
      readonly: false,
    })
    .mountVolume({
      volumeId: 'main',
      subpath: 'cache',
      mountpoint: '/home/appuser/.cache',
      readonly: false,
    })

  return (
    sdk.Daemons.of(effects)
      // Re-chown the mounted subpaths to appuser before the server starts.
      // The image bakes these dirs as 0700 / appuser-owned, but the StartOS
      // volume subpaths land owned by root. Runs as root so it can chown.
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
            'chown -R appuser:appuser /var/lib/crawl4ai/outputs /home/appuser/.cache && chmod 700 /var/lib/crawl4ai/outputs',
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
