import { MetaEvent, MidiEvent, MidiTrackEvent, MTrkEvent } from '../models'
import {
  midiNoteToFrequency,
  calculateTickDuration,
  readUint24BE,
  isTempoEvent,
  isNoteOnEvent,
  isEffectiveNoteOff
} from '../lib'

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
  event: MidiEvent,
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
  event: MidiEvent,
  _ctx: PlaybackContext,
  state: PlaybackState
): void {
  const noteKey = `${event.channel}-${event.data}`
  const oscillator = state.activeNotes.get(noteKey)
  if (oscillator) {
    oscillator.stop(state.scheduledTime)
    state.activeNotes.delete(noteKey)
  }
}

const eventProcessors = [
  {
    predicate: isTempoEvent,
    processor: processTempoChange
  },
  {
    predicate: isNoteOnEvent,
    processor: processNoteOn
  },
  {
    predicate: isEffectiveNoteOff,
    processor: processNoteOff
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

export type { PlaybackState, PlaybackContext }
