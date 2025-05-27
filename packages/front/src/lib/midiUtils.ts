import {
  MIDI_NOTE_A4,
  MIDI_NOTE_A4_FREQUENCY,
  MICROSECONDS_IN_SECOND
} from './constants'

/**
 * Converts a MIDI note number to its corresponding frequency in Hz.
 * Uses equal temperament tuning with A4 = 440 Hz.
 *
 * @param note MIDI note number (0-127)
 * @returns Frequency in Hz
 */
export function midiNoteToFrequency(note: number): number {
  return MIDI_NOTE_A4_FREQUENCY * Math.pow(2, (note - MIDI_NOTE_A4) / 12)
}

/**
 * Calculates tick duration in seconds based on tempo and division.
 *
 * @param tempoMicroseconds Tempo in microseconds per quarter note
 * @param division MIDI division (ticks per quarter note)
 * @returns Duration of one tick in seconds
 */
export function calculateTickDuration(
  tempoMicroseconds: number,
  division: number
): number {
  return tempoMicroseconds / division / MICROSECONDS_IN_SECOND
}
