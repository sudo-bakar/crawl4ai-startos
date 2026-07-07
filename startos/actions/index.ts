import { sdk } from '../sdk'
import { setApiToken } from './setApiToken'

export const actions = sdk.Actions.of().addAction(setApiToken)
