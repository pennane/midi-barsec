import { Buffer } from 'buffer'
import { Track, EventType, MidiEventType, Midi, MetaEventType } from '../models'
import { midiNoteToFrequency } from '../util'
const DEFAULT_TEMPO = 500_000 // Default tempo (500,000 μs per quarter note)
const DEFAULT_DIVISION = 48 // Ticks per quarter note
const MICROSEC_IN_SEC = 1_000_000 // Number of microseconds in a second

// Calculate tick duration in milliseconds
let currentTickDuration = DEFAULT_TEMPO / DEFAULT_DIVISION / MICROSEC_IN_SEC

function* events(track: Track) {
  let eventIndex = 0

  while (eventIndex < track.events.length) {
    const start = eventIndex
    const shouldBatch = track.events[start].deltaTime === 0

    if (!shouldBatch) {
      yield track.events.slice(start, ++eventIndex)
      continue
    }

    while (
      eventIndex < track.events.length &&
      track.events[eventIndex].deltaTime === 0
    ) {
      eventIndex++
    }

    yield track.events.slice(start, eventIndex)

    if (eventIndex >= track.events.length) {
      return
    }
  }
}

async function playTrack(
  ctx: AudioContext,
  gainNode: GainNode,
  analyzer: AnalyserNode,
  track: Track,
  startTime: number,
  division: number,
  type: OscillatorType
) {
  let currentTime = startTime

  const channels = new Map<number, Map<number, OscillatorNode>>()
  for (const eventGroup of events(track)) {
    let deltaTime = eventGroup[0].deltaTime * currentTickDuration
    for (const { event } of eventGroup) {
      if (
        event.type === EventType.Meta &&
        event.metaType === MetaEventType.Tempo
      ) {
        const newTempo = (
          event.buffer instanceof Buffer
            ? event.buffer
            : Buffer.from(event.buffer)
        ).readUIntBE(0, 3)

        currentTickDuration = newTempo / division / MICROSEC_IN_SEC
        deltaTime = eventGroup[0].deltaTime * currentTickDuration
      }

      if (event.type !== EventType.Midi) {
        continue
      }

      if (
        event.eventType !== MidiEventType.NoteOn &&
        event.eventType !== MidiEventType.NoteOff
      ) {
        continue
      }

      let oscs = channels.get(event.channel)!
      if (!oscs) {
        oscs = new Map()
        channels.set(event.channel, oscs)
      }
      let osc = oscs.get(event.data)!

      if (event.eventType === MidiEventType.NoteOff || event.otherData === 0) {
        osc?.stop(currentTime + deltaTime)
        oscs.delete(event.data)
        continue
      }

      osc?.stop(currentTime + deltaTime)

      osc = ctx.createOscillator()
      osc.connect(gainNode)
      osc.connect(analyzer)

      osc.type = type
      oscs.set(event.data, osc)

      osc.frequency.setValueAtTime(
        midiNoteToFrequency(event.data),
        currentTime + deltaTime
      )
      osc.start(currentTime + deltaTime)
    }
    currentTime += deltaTime
  }
}

export async function playMidi(
  ctx: AudioContext,
  gainNode: GainNode,
  analyser: AnalyserNode,
  midi: Midi
) {
  const division = midi.header.division
  if (typeof division !== 'number') throw 'asdf sorry no support'

  let currentTime = ctx.currentTime
  for (const track of midi.tracks) {
    playTrack(
      ctx,
      gainNode,
      analyser,
      track,
      currentTime + 0.25,
      division,
      'sawtooth'
    )
  }
}
