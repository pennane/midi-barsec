import { Channel, PlaybackContext, PlaybackState } from '../models'

export function getOrCreateChannel(
  state: PlaybackState,
  ctx: PlaybackContext,
  channelIndex: number,
  percussion?: boolean
): Channel {
  let channel = state.channels.get(channelIndex)
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
    notes: new Map(),
    sustain: false,
    pitchBend: 0,
    modulation: 0,
    expression: 1,
    volume: 1,
    pressure: 0
  }
  state.channels.set(channelIndex, channel)

  return channel
}
