import { midiNoteToFrequency, pitchBendToMultiplier } from '../lib'
import { Instrument, Note } from './models'

export const createDefaultInstrument = (): Instrument => {
  return {
    playNote(ctx, channel, { noteNumber, velocity }) {
      const baseFrequency = midiNoteToFrequency(noteNumber)
      const gain = ctx.audioContext.createGain()
      gain.gain.setValueAtTime(velocity, ctx.scheduledTime)

      const oscillator = ctx.audioContext.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(
        baseFrequency * pitchBendToMultiplier(channel.pitchBend),
        ctx.scheduledTime
      )

      oscillator.connect(gain)
      gain.connect(channel.panner)
      oscillator.start(ctx.scheduledTime)

      const note: Note = {
        oscillator,
        gain,
        baseFrequency,
        noteNumber,
        baseGain: velocity,
        sustained: channel.sustain
      }
      return note
    },
    stopNote(ctx, _channel, note) {
      note.oscillator.stop(ctx.scheduledTime)
    }
  }
}
