import { instruments } from '../instruments'
import { Channel, PlaybackContext } from '../models'

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

  // Determine the initial instrument based on strategies
  let instrument
  if (ctx.strategies.instruments.type === 'fixed') {
    // Use the fixed instrument from strategy
    instrument = ctx.strategies.instruments.instrument
  } else {
    // Use default instrument (will be overridden by program change events)
    instrument = instruments.basic.default()
  }

  channel = {
    gain,
    panner,
    instrument,
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
