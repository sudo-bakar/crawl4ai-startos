import { i18n } from './i18n'
import { sdk } from './sdk'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const multi = sdk.MultiHost.of(effects, 'web')
  const origin = await multi.bindPort(11235, {
    protocol: 'http',
    preferredExternalPort: 80,
  })

  const ui = sdk.createInterface(effects, {
    name: i18n('Web Interface'),
    id: 'web',
    description: i18n(
      'Playground, API, monitor, and MCP endpoints on a single HTTP port.',
    ),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '/playground',
    query: {},
  })

  return [await origin.export([ui])]
})
