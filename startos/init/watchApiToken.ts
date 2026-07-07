import { setApiToken } from '../actions/setApiToken'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

// Surfaces a critical task when no API token is stored yet. Without it the
// image's entrypoint binds gunicorn to loopback only and the StartOS reverse
// proxy cannot reach the service. The setApiToken action handles generation,
// storage, and display — this watcher only decides whether to prompt.
export const watchApiToken = sdk.setupOnInit(async (effects) => {
  const apiToken = await storeJson.read((s) => s.apiToken).const(effects)

  if (!apiToken) {
    await sdk.action.createOwnTask(effects, setApiToken, 'critical', {
      reason: i18n(
        'Set the API token so the server binds a non-loopback interface and StartOS can reach it.',
      ),
    })
  }
})
