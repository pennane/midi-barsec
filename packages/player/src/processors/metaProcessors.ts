import { Spec, Util } from 'parser'

import { EventProcessor } from '../models'

const announceMessage: EventProcessor<Spec.MetaEvent> = (ctx, event) => {
  const text = new TextDecoder().decode(event.data)
  const currentTime = ctx.audioContext.currentTime
  const delaySeconds = Math.max(0, ctx.scheduledTime - currentTime)
  const delayMs = delaySeconds * 1000
  setTimeout(() => {
    ctx.emit('announcement', {
      type: event.metaType,
      text: text
    })
  }, delayMs)
}

const stopNotes: EventProcessor<Spec.MetaEvent> = (ctx) => {
  for (const channel of ctx.channels.values()) {
    for (const note of channel.notes.values()) {
      try {
        note.oscillator.stop(ctx.audioContext.currentTime)
      } catch {}
    }
  }
}

const setTempo: EventProcessor<Spec.MetaEvent> = (ctx, event) => {
  const newTempo = Util.readUint24BE(event.data, 0)
  ctx.tickDuration = Util.calculateTickDuration(newTempo, ctx.division)
}

export const metaProcessors = {
  [Spec.MetaEventType.SetTempo]: setTempo,
  [Spec.MetaEventType.Lyric]: announceMessage,
  [Spec.MetaEventType.CopyrightNotice]: announceMessage,
  [Spec.MetaEventType.EndOfTrack]: stopNotes,
  [Spec.MetaEventType.TextEvent]: announceMessage
} as { [key in Spec.MetaEventType]?: EventProcessor<Spec.MetaEvent> }
