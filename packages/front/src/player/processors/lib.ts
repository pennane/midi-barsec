import { createDefaultInstrument } from '../instruments'
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
  gain.connect(ctx.analyserNode)

  channel = {
    gain,
    panner,
    instrument: createDefaultInstrument(),
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
