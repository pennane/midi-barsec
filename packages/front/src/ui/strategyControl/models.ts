import { MidiPlayer, MidiPlayerStrategies } from '../../player'

export type UiStrategyOption = { value: string; text: string }
export type UiStrategyControlConfig = {
  label: string
  options: readonly UiStrategyOption[]
}

type UiStrategyUpdateHandler = (player: MidiPlayer, value: string) => void

export type UiStrategyControlDefinition = {
  config: UiStrategyControlConfig
  handler: UiStrategyUpdateHandler
  getValue: (strategies: MidiPlayerStrategies) => string
}
