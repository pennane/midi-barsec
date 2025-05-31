import { MidiChannelMessage } from '../../../spec/auxiliary'
import { Percussion } from '../../../spec/instruments'
import { EventProcessor, Note } from '../../models'
import { getOrCreateChannel } from '../lib'
import { PERCUSSION_CONFIGS } from './config'

import {
  calculateVolume,
  createPercussionSound,
  scheduleNoteCleanup,
  startPercussionSource,
  stopExistingNote,
  stopLongPercussionNote
} from './lib'

// thanks chatgpt
export const percussionProcessors = {
  noteOn: (ctx, event) => {
    const channel = getOrCreateChannel(ctx, event.channel, true)
    const velocity = event.data2 ?? 127

    const noteNumber = event.data1 as Percussion
    const config = PERCUSSION_CONFIGS[noteNumber]
    if (!config || !ctx.percussion) return
    const volume = calculateVolume(config.volume, velocity)

    const existingNote = channel.notes.get(noteNumber)
    if (existingNote) {
      stopExistingNote(existingNote, ctx.scheduledTime)
      channel.notes.delete(noteNumber)
    }

    const { source, gain } = createPercussionSound(
      config,
      ctx.audioContext,
      volume,
      ctx.scheduledTime
    )

    gain.connect(channel.panner)
    startPercussionSource(source, config, ctx.scheduledTime)

    const note = {
      oscillator: source as OscillatorNode,
      gain,
      sustained: false
    } as Note
    channel.notes.set(noteNumber, note)

    scheduleNoteCleanup(channel, noteNumber, note, config.duration)
  },

  noteOff: (ctx, event) => {
    const channel = getOrCreateChannel(ctx, event.channel, true)
    const noteNumber = event.data1 as Percussion
    const note = channel.notes.get(noteNumber)
    const config = PERCUSSION_CONFIGS[noteNumber]

    if (!note || !config) return

    if (config.duration > 0.5) {
      stopLongPercussionNote(note, ctx.scheduledTime)
      channel.notes.delete(noteNumber)
    }
  }
} as const satisfies Record<string, EventProcessor<MidiChannelMessage>>
