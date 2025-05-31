import { calculateTickDuration, readUint24BE } from '../../lib'
import { MetaEvent, MetaEventType } from '../../spec'

import { announce } from '../../ui/textAnnouncer'
import { EventProcessor } from '../models'

const announceMessage: EventProcessor<MetaEvent> = (ctx, event) => {
  const text = new TextDecoder().decode(event.data)
  const currentTime = ctx.audioContext.currentTime
  const delaySeconds = Math.max(0, ctx.scheduledTime - currentTime)
  const delayMs = delaySeconds * 1000

  setTimeout(() => {
    if (ctx.isPlaying) {
      announce(text)
    }
  }, delayMs)
}

const stopNotes: EventProcessor<MetaEvent> = (ctx) => {
  for (const channel of ctx.channels.values()) {
    for (const note of channel.notes.values()) {
      try {
        note.oscillator.stop(ctx.audioContext.currentTime)
      } catch {}
    }
  }
}

export const metaProcessors = {
  [MetaEventType.SetTempo]: (ctx, event) => {
    const newTempo = readUint24BE(event.data, 0)
    ctx.tickDuration = calculateTickDuration(newTempo, ctx.division)
  },
  [MetaEventType.Lyric]: announceMessage,
  [MetaEventType.CopyrightNotice]: announceMessage,
  [MetaEventType.EndOfTrack]: stopNotes
} as { [key in MetaEventType]?: EventProcessor<MetaEvent> }
