import { Spec, Util } from '../../parser'

import { EventProcessor } from '../models'
import { getOrCreateChannel } from './lib'

export const voiceMessageProcessors = {
  noteOn: (ctx, event) => {
    const channel = getOrCreateChannel(ctx, event.channel)
    const velocity = (event.data2 ?? 0) / 127
    const noteNumber = event.data1
    const existingNote = channel.notes.get(noteNumber)

    if (existingNote) {
      try {
        channel.instrument(ctx).stopNote(ctx, channel, existingNote, {
          reapplied: existingNote.sustained
        })
      } catch {}
      channel.notes.delete(noteNumber)
    }

    const newNote = channel.instrument(ctx).playNote(ctx, channel, {
      noteNumber,
      velocity
    })

    channel.notes.set(noteNumber, newNote)
  },
  noteOff: (ctx, event) => {
    const channel = getOrCreateChannel(ctx, event.channel)
    const noteNumber = event.data1
    const note = channel.notes.get(noteNumber)
    if (!note) return

    if (channel.sustain) {
      note.sustained = true
    } else {
      channel.instrument(ctx).stopNote(ctx, channel, note, { reapplied: false })
      channel.notes.delete(noteNumber)
    }
  },
  pitchBend: (ctx, event) => {
    const channel = getOrCreateChannel(ctx, event.channel)
    const lsb = event.data1 ?? 0
    const msb = event.data2 ?? 0
    const value = (msb << 7) | lsb // 14-bit value
    channel.pitchBend = value

    const bendMultiplier = Util.pitchBendToMultiplier(value)

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
  },
  programChange: (ctx, event) => {
    if (ctx.strategies.instruments.type === 'disabled') return

    const channel = getOrCreateChannel(ctx, event.channel)
    channel.updateProgram(
      (event.data1 as Spec.GeneralMidiInstrument.Instrument) ?? 0
    )
  }
} as const satisfies Record<string, EventProcessor<Spec.MidiChannelMessage>>

export const controllerProcessors = {
  [Spec.MidiControllerChange.ChannelVolumeMSB]: (ctx, event) => {
    if (event.data2 === undefined) return
    const channel = getOrCreateChannel(ctx, event.channel)
    const volume = event.data2 / 127
    channel.gain.gain.setValueAtTime(volume, ctx.scheduledTime)
  },
  [Spec.MidiControllerChange.PanMSB]: (ctx, event) => {
    const channel = getOrCreateChannel(ctx, event.channel)
    if (!channel || event.data2 === undefined) return

    const pan = (event.data2 - 64) / 64 // Convert 0–127 to -1.0–1.0
    channel.panner.pan.setValueAtTime(pan, ctx.scheduledTime)
  },
  [Spec.MidiControllerChange.SustainPedal]: (ctx, event) => {
    if (event.data2 === undefined) return
    const isDown = event.data2 >= 64
    const channel = getOrCreateChannel(ctx, event.channel)

    channel.sustain = isDown
    if (isDown) return

    for (const note of channel.notes.values()) {
      if (note.sustained) {
        channel
          .instrument(ctx)
          .stopNote(ctx, channel, note, { reapplied: false })
      }
    }
  },
  [Spec.MidiControllerChange.ResetAllControllers]: (ctx, event): void => {
    const channel = ctx.channels.get(event.channel)
    if (!channel) return

    channel.sustain = false
    channel.panner.pan.setValueAtTime(0, ctx.scheduledTime)
    channel.gain.gain.setValueAtTime(1, ctx.scheduledTime)
  },
  [Spec.MidiControllerChange.AllNotesOff]: (ctx, event) => {
    const channel = getOrCreateChannel(ctx, event.channel)
    for (const note of channel.notes.values()) {
      channel.instrument(ctx).stopNote(ctx, channel, note, { reapplied: false })
    }
  },
  [Spec.MidiControllerChange.ExpressionControllerMSB]: (ctx, event) => {
    const value = event.data2 ?? 0
    const channel = getOrCreateChannel(ctx, event.channel)
    channel.expression = value / 127

    channel.gain.gain.setValueAtTime(
      channel.expression * (channel.volume ?? 1),
      ctx.scheduledTime
    )
  }
} as {
  [key in Spec.MidiControllerChange]?: EventProcessor<Spec.MidiChannelControllerChangeMessage>
}
