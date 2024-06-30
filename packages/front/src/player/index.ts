import {
  EventType,
  MidiEventType,
  MetaEventType,
  EventGenerator
} from '../models'
import { Midi } from '../parser/MidiParser'
import { midiNoteToFrequency } from '../util'

const DEFAULT_TEMPO = 500_000 // Default tempo (500,000 microseconds per quarter note)
const DEFAULT_DIVISION = 48 // Ticks per quarter note
const MICROSEC_IN_SEC = 1_000_000 // Number of microseconds in a second

async function playTrack(
  ctx: AudioContext,
  gainNode: GainNode,
  analyser: AnalyserNode,
  eventGenerator: EventGenerator,
  startTime: number,
  division: number = DEFAULT_DIVISION,
  type: OscillatorType
) {
  let currentTime = startTime
  let tickDuration = DEFAULT_TEMPO / division / MICROSEC_IN_SEC

  function calculateEventTime(deltaTime: number) {
    return deltaTime * tickDuration
  }

  const activeNotes: Map<string, OscillatorNode> = new Map()

  for (const { event, deltaTime } of eventGenerator) {
    currentTime += calculateEventTime(deltaTime)

    if (
      event.type === EventType.Meta &&
      event.metaType === MetaEventType.Tempo
    ) {
      const newTempo =
        (event.dataView.getUint8(0) << 16) |
        (event.dataView.getUint8(1) << 8) |
        event.dataView.getUint8(2)
      tickDuration = newTempo / division / MICROSEC_IN_SEC
      continue
    }

    if (
      event.type !== EventType.Midi ||
      (event.eventType !== MidiEventType.NoteOn &&
        event.eventType !== MidiEventType.NoteOff)
    ) {
      continue
    }

    const noteKey = `${event.channel}-${event.data}`

    if (event.eventType === MidiEventType.NoteOff || event.otherData === 0) {
      activeNotes.get(noteKey)?.stop(currentTime)
      activeNotes.delete(noteKey)
      continue
    }

    let oscillator = activeNotes.get(noteKey)
    oscillator?.stop()
    oscillator = ctx.createOscillator()
    oscillator.connect(gainNode)
    oscillator.connect(analyser)
    oscillator.type = type

    const frequency = midiNoteToFrequency(event.data)
    oscillator.frequency.setValueAtTime(frequency, currentTime)

    oscillator.start(currentTime)
    activeNotes.set(noteKey, oscillator)
  }
}

export async function playMidi(
  ctx: AudioContext,
  gainNode: GainNode,
  analyser: AnalyserNode,
  midi: Midi,
  waveform: OscillatorType
) {
  const division = midi.header.division

  if (typeof division !== 'number') {
    throw new Error(
      'Unsupported division type. Only numerical division is supported.'
    )
  }

  let currentTime = ctx.currentTime + 0.75

  playTrack(
    ctx,
    gainNode,
    analyser,
    midi.generator(),
    currentTime,
    division,
    waveform
  )
}
