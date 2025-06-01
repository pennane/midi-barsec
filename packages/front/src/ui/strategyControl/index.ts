import { MidiPlayer } from '../../player'
import { controllersStrategy } from './controllers'
import { instrumentsStrategy } from './instruments'
import { createControl } from './lib'
import { percussionStrategy } from './percussion'

const strategies = {
  percussion: percussionStrategy,
  instruments: instrumentsStrategy,
  controllers: controllersStrategy
} as const

export function initStrategyControl(player: MidiPlayer): void {
  const container = document.getElementById('strategy-controls')!
  const currentStrategies = player.currentStrategies()

  const controls = Object.entries(strategies).map(([type, strategy]) => {
    return createControl(
      `${type}-strategy`,
      strategy.config,
      strategy.getValue(currentStrategies),
      (value) => strategy.handler(player, value)
    )
  })

  container.append(...controls)
}
