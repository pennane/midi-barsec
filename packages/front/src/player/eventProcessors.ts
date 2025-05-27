import {
  calculateTickDuration,
  isEffectiveNoteOff,
  isEffectiveTextEvent,
  isNoteOnEvent,
  isPercussionEvent,
  isTempoEvent,
  midiNoteToFrequency,
  readUint24BE
} from '../lib'
import { noop } from '../lib/fp'
import {
  MetaEvent,
  MidiChannelMessage,
  MidiTrackEvent,
  MTrkEvent
} from '../models'

type PlaybackState = {
  tickDuration: number
  scheduledTime: number
  activeNotes: Map<string, OscillatorNode>
  isPlaying: boolean
  animationFrameId?: number
  eventIterator: Iterator<MTrkEvent, void, void>
  currentTimeSeconds: number
  totalDurationSeconds: number
  startTime: number
}

type PlaybackContext = {
  audioContext: AudioContext
  gainNode: GainNode
  analyserNode: AnalyserNode
  division: number
  waveform: OscillatorType
}

type EventProcessor<T extends MidiTrackEvent> = (
  event: T,
  ctx: PlaybackContext,
  state: PlaybackState
) => void

type ProcessorPredicate<T extends MidiTrackEvent> = {
  predicate: (event: MidiTrackEvent) => event is T
  processor: EventProcessor<T>
}

function processTempoChange(
  event: MetaEvent,
  ctx: PlaybackContext,
  state: PlaybackState
): void {
  const newTempo = readUint24BE(event.data, 0)
  state.tickDuration = calculateTickDuration(newTempo, ctx.division)
}

function processNoteOn(
  event: MidiChannelMessage,
  ctx: PlaybackContext,
  state: PlaybackState
): void {
  const noteKey = `${event.channel}-${event.data1}`

  const existingOscillator = state.activeNotes.get(noteKey)
  if (existingOscillator) {
    try {
      existingOscillator.stop(state.scheduledTime)
    } catch {
      // Oscillator might already be stopped, ignore the error
    }
  }

  const oscillator = ctx.audioContext.createOscillator()
  oscillator.connect(ctx.gainNode)
  oscillator.connect(ctx.analyserNode)
  oscillator.type = ctx.waveform
  oscillator.frequency.setValueAtTime(
    midiNoteToFrequency(event.data1),
    state.scheduledTime
  )
  oscillator.start(state.scheduledTime)
  state.activeNotes.set(noteKey, oscillator)
}

function processNoteOff(
  event: MidiChannelMessage,
  _ctx: PlaybackContext,
  state: PlaybackState
): void {
  const noteKey = `${event.channel}-${event.data1}`
  const oscillator = state.activeNotes.get(noteKey)
  if (oscillator) {
    oscillator.stop(state.scheduledTime)
    state.activeNotes.delete(noteKey)
  }
}

function processTextEvent(
  event: MetaEvent,
  _ctx: PlaybackContext,
  _state: PlaybackState
): void {
  const text = new TextDecoder().decode(event.data)
  console.log('Text Event:', text, event.metaType)
}

/**
 * REMINDER ARTTU: ORDER MATTERS HERE :D
 */
const eventProcessors = [
  { predicate: isPercussionEvent, processor: noop },
  {
    predicate: isTempoEvent,
    processor: processTempoChange
  },
  {
    predicate: isEffectiveNoteOff,
    processor: processNoteOff
  },
  {
    predicate: isNoteOnEvent,
    processor: processNoteOn
  },
  {
    predicate: isEffectiveTextEvent,
    processor: processTextEvent
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
] satisfies ProcessorPredicate<any>[]

const selectEventProcessor = (
  event: MidiTrackEvent
): EventProcessor<MidiTrackEvent> | undefined => {
  const processorPredicate = eventProcessors.find((p) => p.predicate(event))
  return processorPredicate?.processor as
    | EventProcessor<MidiTrackEvent>
    | undefined
}

export function processEvent(
  event: MidiTrackEvent,
  ctx: PlaybackContext,
  state: PlaybackState
): void {
  const processor = selectEventProcessor(event)
  if (processor) {
    processor(event, ctx, state)
  }
}

export type { PlaybackContext, PlaybackState }
