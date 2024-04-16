import { Track, EventType, MidiEventType, Midi } from '../models'
import { midiNoteToFrequency } from '../util'

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

    if (eventIndex >= track.events.length) {
      return
    }

    yield track.events.slice(start, eventIndex)
  }
}

async function playTrack(
  ctx: AudioContext,
  analyzer: AnalyserNode,
  track: Track,
  startTime: number,
  division: number,
  type: OscillatorType
) {
  let currentTime = startTime
  const channels = new Map<number, OscillatorNode>()
  for (const eventGroup of events(track)) {
    const deltaTime = eventGroup[0].deltaTime / division
    currentTime += deltaTime

    for (const { event } of eventGroup) {
      if (event.type !== EventType.Midi) continue
      if (
        event.eventType !== MidiEventType.NoteOn &&
        event.eventType !== MidiEventType.NoteOff
      ) {
        continue
      }

      let osc = channels.get(event.channel)

      if (event.eventType === MidiEventType.NoteOff || event.otherData === 0) {
        osc?.stop(currentTime)
        channels.delete(event.channel)
        continue
      }

      osc = ctx.createOscillator()
      osc.connect(ctx.destination)
      osc.connect(analyzer)

      osc.type = type
      channels.set(event.channel, osc)

      osc.frequency.setValueAtTime(midiNoteToFrequency(event.data), currentTime)
      osc.start(currentTime)
    }
  }
}

export async function playMidi(
  ctx: AudioContext,
  analyser: AnalyserNode,
  midi: Midi
) {
  const division = midi.header.division
  if (typeof division !== 'number') throw 'asdf sorry no support'
  let currentTime = ctx.currentTime
  midi.tracks.forEach((t, i) =>
    playTrack(
      ctx,
      analyser,
      t,
      currentTime + 0.25,
      division * 4.5,
      (['sawtooth', 'sawtooth', 'sawtooth', 'sawtooth'] as const)[i % 4]
    )
  )
}
