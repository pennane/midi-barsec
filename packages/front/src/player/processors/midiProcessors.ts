import { midiNoteToFrequency, pitchBendToMultiplier } from '../../lib'
import {
  MidiChannelControllerChangeMessage,
  MidiChannelMessage,
  MidiControllerChange
} from '../../spec'

import { EventProcessor } from '../models'
import { getOrCreateChannel } from './lib'

export const voiceMessageProcessors = {
  noteOn: (ctx, event) => {
    const channel = getOrCreateChannel(ctx, event.channel)
    const velocity = (event.data2 ?? 0) / 127
    const baseGain = velocity
    const baseFrequency = midiNoteToFrequency(event.data1)

    const existingNote = channel.notes.get(event.data1)

    if (existingNote?.sustained) {
      existingNote.gain.gain.setValueAtTime(velocity, ctx.scheduledTime)
      return
    }

    if (existingNote) {
      try {
        existingNote.oscillator.stop(ctx.scheduledTime)
      } catch {}
      existingNote.oscillator.disconnect()
      existingNote.gain.disconnect()
      channel.notes.delete(event.data1)
    }

    const gain = ctx.audioContext.createGain()
    gain.gain.setValueAtTime(baseGain, ctx.scheduledTime)

    const oscillator = ctx.audioContext.createOscillator()
    oscillator.type = ctx.waveform
    oscillator.frequency.setValueAtTime(
      baseFrequency * pitchBendToMultiplier(channel.pitchBend),
      ctx.scheduledTime
    )

    oscillator.connect(gain)
    gain.connect(channel.panner)
    oscillator.start(ctx.scheduledTime)

    channel.notes.set(event.data1, {
      oscillator,
      gain,
      baseFrequency,
      baseGain,
      sustained: channel.sustain
    })
  },
  noteOff: (ctx, event) => {
    const channel = getOrCreateChannel(ctx, event.channel)
    const note = channel.notes.get(event.data1)
    if (!note) return

    if (channel.sustain) {
      note.sustained = true
    } else {
      note.oscillator.stop(ctx.scheduledTime)
      channel.notes.delete(event.data1)
    }
  },
  pitchBend: (ctx, event) => {
    const channel = getOrCreateChannel(ctx, event.channel)
    const lsb = event.data1 ?? 0
    const msb = event.data2 ?? 0
    const value = (msb << 7) | lsb // 14-bit value
    channel.pitchBend = value

    const bendMultiplier = pitchBendToMultiplier(value)

    for (const note of channel.notes.values()) {
      note.oscillator.frequency.setValueAtTime(
        note.baseFrequency * bendMultiplier,
        ctx.scheduledTime
      )
    }
  },
  channelPressure: (ctx, event) => {
    const channel = getOrCreateChannel(ctx, event.channel)
    const pressure = (event.data1 ?? 0) / 127
    channel.pressure = pressure

    for (const note of channel.notes.values()) {
      const modulatedGain = note.baseGain * (1 + pressure * 0.1)
      const finalGain = Math.min(modulatedGain, 1)
      note.gain.gain.linearRampToValueAtTime(finalGain, ctx.scheduledTime)
    }
  }
} as const satisfies Record<string, EventProcessor<MidiChannelMessage>>

export const controllerProcessors = {
  [MidiControllerChange.ChannelVolumeMSB]: (ctx, event) => {
    if (event.data2 === undefined) return
    const channel = getOrCreateChannel(ctx, event.channel)
    const volume = event.data2 / 127
    channel.gain.gain.setValueAtTime(volume, ctx.scheduledTime)
  },
  [MidiControllerChange.PanMSB]: (ctx, event) => {
    const channel = getOrCreateChannel(ctx, event.channel)
    if (!channel || event.data2 === undefined) return

    const pan = (event.data2 - 64) / 64 // Convert 0–127 to -1.0–1.0
    channel.panner.pan.setValueAtTime(pan, ctx.scheduledTime)
  },
  [MidiControllerChange.SustainPedal]: (ctx, event) => {
    if (event.data2 === undefined) return
    const isDown = event.data2 >= 64
    const channel = getOrCreateChannel(ctx, event.channel)

    channel.sustain = isDown
    if (isDown) return

    for (const [key, note] of channel.notes.entries()) {
      if (note.sustained) {
        note.oscillator.stop(ctx.scheduledTime)
        channel.notes.delete(key)
      }
    }
  },
  [MidiControllerChange.ResetAllControllers]: (ctx, event): void => {
    const channel = ctx.channels.get(event.channel)
    if (!channel) return

    channel.sustain = false
    channel.panner.pan.setValueAtTime(0, ctx.scheduledTime)
    channel.gain.gain.setValueAtTime(1, ctx.scheduledTime)
  },
  [MidiControllerChange.AllNotesOff]: (ctx, event) => {
    const channel = getOrCreateChannel(ctx, event.channel)
    for (const [key, note] of channel.notes.entries()) {
      note.oscillator.stop(ctx.scheduledTime)
      channel.notes.delete(key)
    }
  },
  [MidiControllerChange.ExpressionControllerMSB]: (ctx, event) => {
    const value = event.data2 ?? 0
    const channel = getOrCreateChannel(ctx, event.channel)
    channel.expression = value / 127

    channel.gain.gain.setValueAtTime(
      channel.expression * (channel.volume ?? 1),
      ctx.scheduledTime
    )
  }
} as {
  [key in MidiControllerChange]?: EventProcessor<MidiChannelControllerChangeMessage>
}
