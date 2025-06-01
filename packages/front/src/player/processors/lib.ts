import { Spec } from '../../parser'
import { instrumentForProgramNumber, instruments, silent } from '../instruments'
import { Channel, PlaybackContext } from '../models'

const instrumentHandler = (ctx: PlaybackContext) => {
  let programInstrument = instruments.basic.default()

  return {
    instrument: () => {
      if (ctx.strategies.instruments.type === 'disabled') {
        return silent
      } else if (ctx.strategies.instruments.type === 'fixed') {
        return ctx.strategies.instruments.instrument
      }
      return programInstrument
    },
    updateProgram: (programNumber: Spec.GeneralMidiInstrument.Instrument) => {
      programInstrument = instrumentForProgramNumber(programNumber)
    }
  }
}

export function getOrCreateChannel(
  ctx: PlaybackContext,
  channelIndex: number,
  percussion?: boolean
): Channel {
  let channel = ctx.channels.get(channelIndex)
  if (channel) return channel

  const gain = ctx.audioContext.createGain()
  if (percussion) gain.gain.value = 3
  const panner = ctx.audioContext.createStereoPanner()
  panner.connect(gain)
  gain.connect(ctx.gainNode)

  channel = {
    gain,
    panner,
    ...instrumentHandler(ctx),
    notes: new Map(),
    sustain: false,
    pitchBend: 0,
    modulation: 0,
    expression: 1,
    volume: 1,
    pressure: 0
  }
  ctx.channels.set(channelIndex, channel)

  return channel
}
