import { Instruments, MidiPlayer, MidiPlayerStrategies } from '../../player'
import { createOption } from './lib'
import { UiStrategyControlDefinition, UiStrategyOption } from './models'

const formatInstrumentName = (name: string): string => {
  if (name === 'default') return 'Default'
  return name.charAt(0).toUpperCase() + name.slice(1)
}

const formatGroupName = (name: string): string =>
  name.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())

const createInstrumentOptions = (): UiStrategyOption[] => [
  createOption('instruments', 'Auto'),
  createOption('disabled', 'Disabled'),
  ...Object.keys(Instruments.instruments.basic).map((name) =>
    createOption(`fixed-${name}`, formatInstrumentName(name))
  ),
  ...Object.keys(Instruments.instruments.groups).map((name) =>
    createOption(`fixed-${name}`, formatGroupName(name))
  )
]

const createFixedInstrument = (instrumentType: string) => {
  if (instrumentType in Instruments.instruments.basic) {
    return {
      instrument:
        Instruments.instruments.basic[
          instrumentType as keyof typeof Instruments.instruments.basic
        ](),
      name: formatInstrumentName(instrumentType)
    }
  }

  if (instrumentType in Instruments.instruments.groups) {
    return {
      instrument:
        Instruments.instruments.groups[
          instrumentType as keyof typeof Instruments.instruments.groups
        ](),
      name: formatGroupName(instrumentType)
    }
  }

  return {
    instrument: Instruments.instruments.groups.piano(),
    name: 'Piano'
  }
}

const updateInstrumentsStrategy = (player: MidiPlayer, value: string): void => {
  if (value === 'instruments') {
    player.updateStrategies({ instruments: { type: 'instruments' } })
    return
  }

  if (value === 'disabled') {
    player.updateStrategies({ instruments: { type: 'disabled' } })
    return
  }

  if (!value.startsWith('fixed-')) return

  const instrumentType = value.replace('fixed-', '')
  const { instrument, name } = createFixedInstrument(instrumentType)

  player.updateStrategies({
    instruments: { type: 'fixed', instrument, name }
  })
}

const getInstrumentsValue = (strategies: MidiPlayerStrategies): string => {
  const strategy = strategies.instruments

  if (
    !('type' in strategy) ||
    strategy.type !== 'fixed' ||
    !('name' in strategy)
  ) {
    return strategy.type
  }

  const instrumentKey = strategy.name.toLowerCase().replace(/\s+/g, '')
  return `fixed-${instrumentKey}`
}

export const instrumentsStrategy: UiStrategyControlDefinition = {
  config: {
    label: '🎹',
    options: createInstrumentOptions()
  },
  handler: updateInstrumentsStrategy,
  getValue: getInstrumentsValue
}
