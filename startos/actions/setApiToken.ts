import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const setApiToken = sdk.Action.withoutInput(
  'set-api-token',
  async () => ({
    name: i18n('Set API Token'),
    description: i18n(
      'Generate or rotate the Crawl4AI API token. Required for the server to bind a non-loopback interface so StartOS can reach it.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  async ({ effects }) => {
    const apiToken = utils.getDefaultString({
      charset: 'a-z,A-Z,0-9',
      len: 64,
    })
    await storeJson.merge(effects, { apiToken })

    return {
      version: '1',
      title: i18n('API Token'),
      message: i18n(
        'Use this token as `Authorization: Bearer <token>` on every API request. The service restarts automatically to pick up the new token.',
      ),
      result: {
        type: 'single',
        name: i18n('Token'),
        description: null,
        value: apiToken,
        masked: true,
        copyable: true,
        qr: false,
      },
    }
  },
)
