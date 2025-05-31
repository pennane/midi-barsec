import { MidiReader, MTrkEvent } from '../spec'
import {
  DEFAULT_TEMPO,
  MICROSECONDS_IN_SECOND,
  MIDI_NOTE_A4,
  MIDI_NOTE_A4_FREQUENCY
} from './constants'
import { readUint24BE } from './dataUtils'
import { isTempoEvent } from './typeGuards'

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

/**
 * Calculates the total duration of a MIDI file in seconds.
 * Accounts for tempo changes throughout the file.
 *
 * CONSUMES THE READER
 *
 * @param reader MIDI reader generator
 * @param division MIDI division (ticks per quarter note)
 * @returns Total duration in seconds
 */
export function calculateMidiDuration(
  reader: MidiReader,
  division: number
): number {
  let totalTime = 0
  let currentTempo = DEFAULT_TEMPO
  let tickDuration = calculateTickDuration(currentTempo, division)

  for (const { event, deltaTime } of reader) {
    if (isTempoEvent(event)) {
      currentTempo = readUint24BE(event.data, 0)
      tickDuration = calculateTickDuration(currentTempo, division)
    }
    totalTime += deltaTime * tickDuration
  }

  return totalTime
}

/**
 * Creates a new MIDI reader that starts from a specific time position.
 * This function consumes the reader to find the seek position, but this is
 * acceptable since we're creating a new reader for seeking purposes.
 *
 * @param reader Original MIDI reader
 * @param division MIDI division
 * @param targetTimeSeconds Target time in seconds to seek to
 * @returns Object with new reader and actual position reached
 */
export function createSeekableReader(
  reader: MidiReader,
  division: number,
  targetTimeSeconds: number
): { reader: MidiReader; actualPosition: number } {
  const events: MTrkEvent[] = []
  let currentTime = 0
  let currentTempo = DEFAULT_TEMPO
  let tickDuration = calculateTickDuration(currentTempo, division)
  let seekIndex = 0
  let found = false

  for (const event of reader) {
    events.push(event)

    if (isTempoEvent(event.event)) {
      currentTempo = readUint24BE(event.event.data, 0)
      tickDuration = calculateTickDuration(currentTempo, division)
    }

    const eventTime = event.deltaTime * tickDuration
    if (!found && currentTime + eventTime >= targetTimeSeconds) {
      seekIndex = events.length - 1
      found = true
    }

    if (!found) {
      currentTime += eventTime
    }
  }

  function* createReaderFromPosition(): MidiReader {
    for (let i = seekIndex; i < events.length; i++) {
      yield events[i]
    }
  }

  return {
    reader: createReaderFromPosition(),
    actualPosition: currentTime
  }
}

export function pitchBendToMultiplier(pitchBend: number, range = 2) {
  const bend = (pitchBend - 8192) / 8192 // -1 to +1
  const semitoneOffset = bend * range
  return Math.pow(2, semitoneOffset / 12)
}
