import { PlaybackState, PlaybackContext, Channel } from '../models'

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
    sustain: false
  }
  state.channels.set(channelIndex, channel)

  return channel
}
