import { MidiPlayer, MidiPlayerStrategies } from '../../player'
import { createOption } from './lib'
import { UiStrategyControlDefinition } from './models'

const updateControllersStrategy = (player: MidiPlayer, value: string): void => {
  const type = value as 'enabled' | 'disabled'
  player.updateStrategies({ controllers: { type } })
}

const getControllersValue = (strategies: MidiPlayerStrategies): string => {
  return strategies.controllers.type
}

export const controllersStrategy: UiStrategyControlDefinition = {
  config: {
    label: '🎮',
    options: [
      createOption('enabled', 'Enabled'),
      createOption('disabled', 'Disabled')
    ] as const
  },
  handler: updateControllersStrategy,
  getValue: getControllersValue
}
