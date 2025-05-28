import { MidiChannelMessage, GeneralMidiPercussion } from '../../../models'
import { getOrCreateChannel } from '../lib'
import { EventProcessor } from '../../models'

import {
  getPercussionConfig,
  stopExistingNote,
  startPercussionSource,
  scheduleNoteCleanup,
  stopLongPercussionNote,
  createPercussionSound
} from './lib'

// thanks chatgpt
export const percussionProcessors = {
  noteOn: (event: MidiChannelMessage, ctx, state) => {
    const channel = getOrCreateChannel(state, ctx, event.channel, true)
    const velocity = event.data2 ?? 127
    const noteNumber = event.data1 as GeneralMidiPercussion
    const config = getPercussionConfig(noteNumber)

    const existingNote = channel.notes.get(noteNumber)
    if (existingNote) {
      stopExistingNote(existingNote, state.scheduledTime)
      channel.notes.delete(noteNumber)
    }

    const { source, gain } = createPercussionSound(
      config,
      ctx.audioContext,
      velocity,
      state.scheduledTime
    )

    gain.connect(channel.panner)
    startPercussionSource(source, config, state.scheduledTime)

    const note = {
      oscillator: source as OscillatorNode,
      gain,
      sustained: false
    }
    channel.notes.set(noteNumber, note)

    scheduleNoteCleanup(channel, noteNumber, note, config.duration)
  },

  noteOff: (event: MidiChannelMessage, ctx, state) => {
    const channel = getOrCreateChannel(state, ctx, event.channel, true)
    const noteNumber = event.data1
    const note = channel.notes.get(noteNumber)

    if (!note) return

    const config = getPercussionConfig(noteNumber as GeneralMidiPercussion)

    if (config.duration > 0.5) {
      stopLongPercussionNote(note, state.scheduledTime)
      channel.notes.delete(noteNumber)
    }
  }
} as const satisfies Record<string, EventProcessor<MidiChannelMessage>>
