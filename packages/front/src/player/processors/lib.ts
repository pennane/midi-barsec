import {
  PlaybackState,
  PlaybackContext,
  Channel,
  ProcessorPredicate
} from '../models'

export const predicateProcessor =
  <IN>(rules: ProcessorPredicate<IN, any>[]) =>
  (event: IN, ctx: PlaybackContext, state: PlaybackState) =>
    rules.find((p) => p.predicate(event))?.processor(event, ctx, state)

export function getOrCreateChannel(
  state: PlaybackState,
  ctx: PlaybackContext,
  channelIndex: number
): Channel {
  let channel = state.channels.get(channelIndex)
  if (channel) return channel

  const gain = ctx.audioContext.createGain()
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
