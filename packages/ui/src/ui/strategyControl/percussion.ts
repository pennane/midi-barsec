import { MidiPlayer, MidiPlayerStrategies } from 'player'
import { createOption } from './lib'
import { UiStrategyControlDefinition } from './models'

const updatePercussionStrategy = (player: MidiPlayer, value: string): void => {
  const type = value as 'enabled' | 'disabled'
  player.updateStrategies({ percussion: { type } })
}

const getPercussionValue = (strategies: MidiPlayerStrategies): string => {
  return strategies.percussion.type
}

export const percussionStrategy: UiStrategyControlDefinition = {
  config: {
    label: '🥁',
    options: [
      createOption('enabled', 'Enabled'),
      createOption('disabled', 'Disabled')
    ] as const
  },
  handler: updatePercussionStrategy,
  getValue: getPercussionValue
}
