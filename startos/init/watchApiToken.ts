import { setApiToken } from '../actions/setApiToken'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

// Surfaces a critical task when no API token is stored yet. Without it the
// image's entrypoint binds gunicorn to loopback only and the StartOS reverse
// proxy cannot reach the service. The setApiToken action handles generation,
// storage, and display — this watcher only decides whether to prompt.
export const watchApiToken = sdk.setupOnInit(async (effects) => {
  // Reactive read: when setApiToken writes store.json, StartOS re-runs this
  // watcher, the `!apiToken` branch no longer fires, and the critical task
  // is not re-registered (tasks are idempotent by default replayId — see
  // tasks.md §Idempotency). A .once() read would freeze the snapshot at the
  // first init and leave the "Set API Token" task stuck in the UI even after
  // the user runs the action, even though the daemon-side fix in 0.9.0:2
  // restarts the container with the new token. The recipe this mirrors is
  // tasks.md §"Prompt When Credentials Are Unset" + init.md §"Watch State
  // and Prompt".
  const apiToken = await storeJson.read((s) => s.apiToken).const(effects)

  if (!apiToken) {
    await sdk.action.createOwnTask(effects, setApiToken, 'critical', {
      reason: i18n(
        'Set the API token so the server binds a non-loopback interface and StartOS can reach it.',
      ),
    })
  }
})
