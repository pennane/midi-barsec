import { calculateTickDuration, readUint24BE } from '../../lib'
import { MetaEvent, MetaEventType } from '../../models'
import { announce } from '../../ui/textAnnouncer'
import { EventProcessor } from '../models'

const announceMessage: EventProcessor<MetaEvent> = (event, ctx, state) => {
  const text = new TextDecoder().decode(event.data)
  const currentTime = ctx.audioContext.currentTime
  const delaySeconds = Math.max(0, state.scheduledTime - currentTime)
  const delayMs = delaySeconds * 1000

  setTimeout(() => {
    if (state.isPlaying) {
      announce(text)
    }
  }, delayMs)
}

export const metaProcessors = {
  [MetaEventType.SetTempo]: (event, ctx, state) => {
    const newTempo = readUint24BE(event.data, 0)
    state.tickDuration = calculateTickDuration(newTempo, ctx.division)
  },
  [MetaEventType.Lyric]: announceMessage,
  [MetaEventType.CopyrightNotice]: announceMessage
} as { [key in MetaEventType]?: EventProcessor<MetaEvent> }
