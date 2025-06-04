import type { MidiParser, MidiReader } from '.'
import { Spec } from '.'

const MIDI_NOTE_A4 = 69
const MIDI_NOTE_A4_FREQUENCY = 440
const MICROSECONDS_IN_SECOND = 1_000_000
const DEFAULT_TEMPO = 500_000

function isTempoEvent(event: Spec.MidiTrackEvent): event is Spec.MetaEvent {
  return (
    event.type === Spec.EventType.Meta &&
    event.metaType === Spec.MetaEventType.SetTempo
  )
}

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
 * Creates a MIDI reader that starts from a specific time position.
 * This generator function seeks to the target time and then yields events directly
 * without storing them in memory, making it more memory efficient.
 *
 * @param parser MIDI parser containing the data and header
 * @param startingTimeSeconds Starting time in seconds to seek to
 * @returns Generator that yields MIDI events from the starting time
 */
export function* withStartingTime(
  parser: MidiParser,
  startingTimeSeconds: number
): MidiReader {
  const division = parser.header.division
  if (typeof division !== 'number') {
    throw new Error('Unsupported division type for seeking')
  }

  const reader = parser.reader()
  let currentTime = 0
  let currentTempo = DEFAULT_TEMPO
  let tickDuration = calculateTickDuration(currentTempo, division)
  let found = false

  for (const event of reader) {
    if (isTempoEvent(event.event)) {
      currentTempo = readUint24BE(event.event.data, 0)
      tickDuration = calculateTickDuration(currentTempo, division)
    }

    const eventTime = event.deltaTime * tickDuration

    if (!found) {
      if (currentTime + eventTime >= startingTimeSeconds) {
        found = true
        // Yield this event and all subsequent ones
        yield event
      } else {
        currentTime += eventTime
      }
    } else {
      // We've found our starting point, yield all remaining events
      yield event
    }
  }
}

export function pitchBendToMultiplier(pitchBend: number, range = 2) {
  const bend = (pitchBend - 8192) / 8192 // -1 to +1
  const semitoneOffset = bend * range
  return Math.pow(2, semitoneOffset / 12)
}

/**
 * Reads a variable-length quantity from a DataView
 * core MIDI parsing utility used throughout the MIDI specification
 *
 * @param view The DataView to read from
 * @param offset The byte offset to start reading from
 * @returns An object containing the parsed value and the number of bytes consumed
 */
export function readVariableLengthQuantity(
  view: DataView,
  offset: number
): { value: number; length: number } {
  let value = 0
  let length = 0
  let byte: number

  do {
    byte = view.getUint8(offset + length)
    value = (value << 7) | (byte & 0x7f)
    length++
  } while (byte & 0x80)

  return { value, length }
}

/**
 * Reads a 24-bit big-endian integer from a DataView
 * used for MIDI tempo values
 *
 * @param view The DataView to read from
 * @param offset The byte offset to start reading from
 * @returns The 24-bit integer value
 */
export function readUint24BE(view: DataView, offset: number): number {
  return (
    (view.getUint8(offset) << 16) |
    (view.getUint8(offset + 1) << 8) |
    view.getUint8(offset + 2)
  )
}
