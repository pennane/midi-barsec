import {
  MetaEventType,
  MidiEventType,
  MidiTrackEvent,
  MTrkEvent
} from '../models'
import {
  midiNoteToFrequency,
  calculateTickDuration,
  readUint24BE,
  isTempoEvent,
  isMidiEvent,
  isMetaEvent,
  isNoteOnEvent,
  isNoteOnWithZeroVelocity
} from '../lib'

type PlaybackState = {
  tickDuration: number
  scheduledTime: number
  activeNotes: Map<string, OscillatorNode>
  isPlaying: boolean
  animationFrameId?: number
  eventIterator: Iterator<MTrkEvent, void, void>
}

type PlaybackContext = {
  audioContext: AudioContext
  gainNode: GainNode
  analyserNode: AnalyserNode
  division: number
  waveform: OscillatorType
}

type EventProcessor = (
  event: MidiTrackEvent,
  ctx: PlaybackContext,
  state: PlaybackState
) => void

type ProcessorPredicate =
  | { type: 'meta'; metaType: MetaEventType; processor: EventProcessor }
  | { type: 'midi'; eventType: MidiEventType; processor: EventProcessor }
  | {
      type: 'other'
      predicate: (event: MidiTrackEvent) => boolean
      processor: EventProcessor
    }

function processTempoChange(
  event: MidiTrackEvent,
  ctx: PlaybackContext,
  state: PlaybackState
): void {
  if (isTempoEvent(event)) {
    const newTempo = readUint24BE(event.data, 0)
    state.tickDuration = calculateTickDuration(newTempo, ctx.division)
  }
}

function processNoteOn(
  event: MTrkEvent['event'],
  ctx: PlaybackContext,
  state: PlaybackState
): void {
  if (isNoteOnEvent(event) && event.otherData !== 0) {
    const noteKey = `${event.channel}-${event.data}`
    const oscillator = ctx.audioContext.createOscillator()
    oscillator.connect(ctx.gainNode)
    oscillator.connect(ctx.analyserNode)
    oscillator.type = ctx.waveform
    oscillator.frequency.setValueAtTime(
      midiNoteToFrequency(event.data),
      state.scheduledTime
    )
    oscillator.start(state.scheduledTime)
    state.activeNotes.set(noteKey, oscillator)
  }
}

function processNoteOff(
  event: MTrkEvent['event'],
  _ctx: PlaybackContext,
  state: PlaybackState
): void {
  if (isMidiEvent(event)) {
    const noteKey = `${event.channel}-${event.data}`
    const oscillator = state.activeNotes.get(noteKey)
    if (oscillator) {
      oscillator.stop(state.scheduledTime)
      state.activeNotes.delete(noteKey)
    }
  }
}

const eventProcessors: Array<ProcessorPredicate> = [
  {
    type: 'meta',
    metaType: MetaEventType.Tempo,
    processor: processTempoChange
  },
  {
    type: 'midi',
    eventType: MidiEventType.NoteOn,
    processor: processNoteOn
  },
  {
    type: 'midi',
    eventType: MidiEventType.NoteOff,
    processor: processNoteOff
  },
  {
    type: 'other',
    predicate: isNoteOnWithZeroVelocity,
    processor: processNoteOff
  }
]

const selectEventProcessor = (
  event: MTrkEvent['event']
): EventProcessor | undefined => {
  const processorPredicate = eventProcessors.find((p) => {
    switch (p.type) {
      case 'meta':
        return isMetaEvent(event) && event.metaType === p.metaType
      case 'midi':
        return isMidiEvent(event) && event.eventType === p.eventType
      case 'other':
        return p.predicate(event)
    }
  })

  return processorPredicate?.processor
}

export function processEvent(
  event: MTrkEvent['event'],
  ctx: PlaybackContext,
  state: PlaybackState
): void {
  const processor = selectEventProcessor(event)
  if (processor) {
    processor(event, ctx, state)
  }
}

export type { PlaybackState, PlaybackContext }
