import { midiNoteToFrequency } from '../../lib'
import {
  MidiChannelControllerChangeMessage,
  MidiChannelMessage,
  MidiChannelVoiceMessageType,
  MidiControllerChange
} from '../../models'
import { getOrCreateChannel } from './lib'
import { EventProcessor } from '../models'

export const voiceMessageProcessors = {
  [MidiChannelVoiceMessageType.NoteOn]: (event, ctx, state) => {
    const channel = getOrCreateChannel(state, ctx, event.channel)
    const velocity = (event.data2 ?? 0) / 127
    const existingNote = channel.notes.get(event.data1)

    if (existingNote?.sustained) {
      existingNote.gain.gain.setValueAtTime(velocity, state.scheduledTime)
      return
    }

    if (existingNote) {
      try {
        existingNote.oscillator.stop(state.scheduledTime)
      } catch {}
      existingNote.oscillator.disconnect()
      existingNote.gain.disconnect()
      channel.notes.delete(event.data1)
    }

    const oscillator = ctx.audioContext.createOscillator()
    const gain = ctx.audioContext.createGain()

    gain.gain.setValueAtTime(velocity, state.scheduledTime)
    oscillator.type = ctx.waveform
    oscillator.frequency.setValueAtTime(
      midiNoteToFrequency(event.data1),
      state.scheduledTime
    )

    oscillator.connect(gain)
    gain.connect(channel.panner)
    oscillator.start(state.scheduledTime)

    channel.notes.set(event.data1, {
      oscillator,
      gain,
      sustained: false
    })
  },
  [MidiChannelVoiceMessageType.NoteOff]: (event, ctx, state) => {
    const channel = getOrCreateChannel(state, ctx, event.channel)
    const note = channel.notes.get(event.data1)
    if (!note) return

    if (channel.sustain) {
      note.sustained = true
    } else {
      note.oscillator.stop(state.scheduledTime)
      channel.notes.delete(event.data1)
    }
  }
} as const satisfies {
  [key in MidiChannelVoiceMessageType]?: EventProcessor<MidiChannelMessage>
}

export const controllerProcessors = {
  [MidiControllerChange.ChannelVolumeMSB]: (event, ctx, state) => {
    if (event.data2 === undefined) return
    const channel = getOrCreateChannel(state, ctx, event.channel)
    const volume = event.data2 / 127
    channel.gain.gain.setValueAtTime(volume, state.scheduledTime)
  },
  [MidiControllerChange.PanMSB]: (event, ctx, state) => {
    const channel = getOrCreateChannel(state, ctx, event.channel)
    if (!channel || event.data2 === undefined) return

    const pan = (event.data2 - 64) / 64 // Convert 0–127 to -1.0–1.0
    channel.panner.pan.setValueAtTime(pan, state.scheduledTime)
  },
  [MidiControllerChange.SustainPedal]: (event, ctx, state) => {
    if (event.data2 === undefined) return
    const isDown = event.data2 >= 64
    const channel = getOrCreateChannel(state, ctx, event.channel)

    channel.sustain = isDown
    if (isDown) return

    for (const [key, note] of channel.notes.entries()) {
      if (note.sustained) {
        note.oscillator.stop(state.scheduledTime)
        channel.notes.delete(key)
      }
    }
  },
  [MidiControllerChange.ResetAllControllers]: (event, _ctx, state): void => {
    const channel = state.channels.get(event.channel)
    if (!channel) return

    channel.sustain = false
    channel.panner.pan.setValueAtTime(0, state.scheduledTime)
    channel.gain.gain.setValueAtTime(1, state.scheduledTime)
  }
} as const satisfies {
  [key in MidiControllerChange]?: EventProcessor<MidiChannelControllerChangeMessage>
}
