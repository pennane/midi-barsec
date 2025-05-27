import { EventType, MetaEventType, MidiEventType, MidiReader } from '../models'
import { MidiParser } from '../parser/midiParser'
import { midiNoteToFrequency } from '../util/midi'

const DEFAULT_TEMPO = 500_000 // Default tempo (500,000 microseconds per quarter note)
const MICROSEC_IN_SEC = 1_000_000 // Number of microseconds in a second

async function playTrackIncremental(
  ctx: AudioContext,
  gainNode: GainNode,
  analyser: AnalyserNode,
  reader: MidiReader,
  division: number,
  type: OscillatorType
) {
  const SCHEDULE_AHEAD_TIME = 1.0 // seconds
  const CHECK_INTERVAL = 100 // ms

  let tickDuration = DEFAULT_TEMPO / division / MICROSEC_IN_SEC
  let scheduledTime = ctx.currentTime
  const activeNotes: Map<string, OscillatorNode> = new Map()

  const iterator = reader[Symbol.iterator]()
  let done = false
  let nextEvent = iterator.next()

  function scheduleEvents() {
    const maxTime = ctx.currentTime + SCHEDULE_AHEAD_TIME

    while (!done && scheduledTime < maxTime) {
      const { value, done } = nextEvent
      if (done) return

      const { event, deltaTime } = value
      const eventTime = deltaTime * tickDuration
      scheduledTime += eventTime

      if (
        event.type === EventType.Meta &&
        event.metaType === MetaEventType.Tempo
      ) {
        const newTempo =
          (event.data.getUint8(0) << 16) |
          (event.data.getUint8(1) << 8) |
          event.data.getUint8(2)
        tickDuration = newTempo / division / MICROSEC_IN_SEC
        nextEvent = iterator.next()
        continue
      }

      if (
        event.type !== EventType.Midi ||
        (event.eventType !== MidiEventType.NoteOn &&
          event.eventType !== MidiEventType.NoteOff)
      ) {
        nextEvent = iterator.next()
        continue
      }

      const noteKey = `${event.channel}-${event.data}`

      if (event.eventType === MidiEventType.NoteOff || event.otherData === 0) {
        const osc = activeNotes.get(noteKey)
        if (osc) {
          osc.stop(scheduledTime)
          activeNotes.delete(noteKey)
        }
        nextEvent = iterator.next()
        continue
      }

      const osc = ctx.createOscillator()
      osc.connect(gainNode)
      osc.connect(analyser)
      osc.type = type
      osc.frequency.setValueAtTime(
        midiNoteToFrequency(event.data),
        scheduledTime
      )
      osc.start(scheduledTime)
      activeNotes.set(noteKey, osc)

      nextEvent = iterator.next()
    }
  }

  const interval = setInterval(() => {
    if (done) {
      clearInterval(interval)
      return
    }
    scheduleEvents()
  }, CHECK_INTERVAL)
}

export async function playMidi(
  ctx: AudioContext,
  gainNode: GainNode,
  analyser: AnalyserNode,
  midi: MidiParser,
  waveform: OscillatorType
) {
  const division = midi.header.division

  if (typeof division !== 'number') {
    throw new Error(
      'Unsupported division type. Only numerical division is supported.'
    )
  }

  await playTrackIncremental(
    ctx,
    gainNode,
    analyser,
    midi.reader,
    division,
    waveform
  )
}
