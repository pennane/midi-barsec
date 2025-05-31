import { midiNoteToFrequency, pitchBendToMultiplier } from '../../lib'
import {
  MidiChannelControllerChangeMessage,
  MidiChannelMessage,
  MidiControllerChange
} from '../../models'
import { EventProcessor } from '../models'
import { getOrCreateChannel } from './lib'

export const voiceMessageProcessors = {
  noteOn: (event, ctx, state) => {
    const channel = getOrCreateChannel(state, ctx, event.channel)
    const velocity = (event.data2 ?? 0) / 127
    const baseGain = velocity
    const baseFrequency = midiNoteToFrequency(event.data1)

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

    const gain = ctx.audioContext.createGain()
    gain.gain.setValueAtTime(baseGain, state.scheduledTime)

    const oscillator = ctx.audioContext.createOscillator()
    oscillator.type = ctx.waveform
    oscillator.frequency.setValueAtTime(
      baseFrequency * pitchBendToMultiplier(channel.pitchBend),
      state.scheduledTime
    )

    oscillator.connect(gain)
    gain.connect(channel.panner)
    oscillator.start(state.scheduledTime)

    channel.notes.set(event.data1, {
      oscillator,
      gain,
      baseFrequency,
      baseGain,
      sustained: channel.sustain
    })
  },
  noteOff: (event, ctx, state) => {
    const channel = getOrCreateChannel(state, ctx, event.channel)
    const note = channel.notes.get(event.data1)
    if (!note) return

    if (channel.sustain) {
      note.sustained = true
    } else {
      note.oscillator.stop(state.scheduledTime)
      channel.notes.delete(event.data1)
    }
  },
  pitchBend: (event, ctx, state) => {
    const channel = getOrCreateChannel(state, ctx, event.channel)
    const lsb = event.data1 ?? 0
    const msb = event.data2 ?? 0
    const value = (msb << 7) | lsb // 14-bit value
    channel.pitchBend = value

    const bendMultiplier = pitchBendToMultiplier(value)

    for (const note of channel.notes.values()) {
      note.oscillator.frequency.setValueAtTime(
        note.baseFrequency * bendMultiplier,
        state.scheduledTime
      )
    }
  },
  channelPressure: (event, ctx, state) => {
    const channel = getOrCreateChannel(state, ctx, event.channel)
    const pressure = (event.data1 ?? 0) / 127
    channel.pressure = pressure

    for (const note of channel.notes.values()) {
      const modulatedGain = note.baseGain * (1 + pressure * 0.1)
      const finalGain = Math.min(modulatedGain, 1)
      note.gain.gain.linearRampToValueAtTime(finalGain, state.scheduledTime)
    }
  }
} as const satisfies Record<string, EventProcessor<MidiChannelMessage>>

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
  },
  [MidiControllerChange.AllNotesOff]: (event, ctx, state) => {
    const channel = getOrCreateChannel(state, ctx, event.channel)
    for (const [key, note] of channel.notes.entries()) {
      note.oscillator.stop(state.scheduledTime)
      channel.notes.delete(key)
    }
  },
  [MidiControllerChange.ExpressionControllerMSB]: (event, ctx, state) => {
    const value = event.data2 ?? 0
    const channel = getOrCreateChannel(state, ctx, event.channel)
    channel.expression = value / 127

    channel.gain.gain.setValueAtTime(
      channel.expression * (channel.volume ?? 1),
      state.scheduledTime
    )
  }
} as {
  [key in MidiControllerChange]?: EventProcessor<MidiChannelControllerChangeMessage>
}
