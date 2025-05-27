import {
  calculateTickDuration,
  isChannelVolumeEvent,
  isEffectiveTextEvent,
  isNoteOffEvent,
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
  channels: Map<
    number,
    {
      gain: GainNode
      notes: Map<number, { gain: GainNode; oscillator: OscillatorNode }>
    }
  >
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
  let channel = state.channels.get(event.channel)
  if (!channel) {
    channel = { gain: ctx.audioContext.createGain(), notes: new Map() }
    state.channels.set(event.channel, channel)
  }

  const existingOscillator = channel.notes.get(event.data1)
  if (existingOscillator) {
    try {
      existingOscillator.oscillator.stop(state.scheduledTime)
    } catch {
      // Oscillator might already be stopped, ignore the error
    }
  }

  const oscillator = ctx.audioContext.createOscillator()
  const gain = ctx.audioContext.createGain()

  const velocity = (event.data2 ?? 0) / 127
  gain.gain.setValueAtTime(velocity, state.scheduledTime)

  oscillator.type = ctx.waveform
  oscillator.frequency.setValueAtTime(
    midiNoteToFrequency(event.data1),
    state.scheduledTime
  )

  oscillator.connect(gain)
  gain.connect(ctx.gainNode)
  gain.connect(ctx.analyserNode)

  oscillator.start(state.scheduledTime)
  channel.notes.set(event.data1, { oscillator, gain })
}

function processNoteOff(
  event: MidiChannelMessage,
  _ctx: PlaybackContext,
  state: PlaybackState
): void {
  const channel = state.channels.get(event.channel)
  if (!channel) return
  const oscillator = channel.notes.get(event.data1)?.oscillator
  if (!oscillator) return
  oscillator.stop(state.scheduledTime)
  channel.notes.delete(event.data1)
}

function processChannelVolume(
  event: MidiChannelMessage,
  _ctx: PlaybackContext,
  state: PlaybackState
): void {
  const channel = state.channels.get(event.channel)
  if (!channel || event.data2 === undefined) return

  const volume = event.data2 / 127
  channel.gain.gain.setValueAtTime(volume, state.scheduledTime)
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
    predicate: isNoteOffEvent,
    processor: processNoteOff
  },
  {
    predicate: isNoteOnEvent,
    processor: processNoteOn
  },
  { predicate: isChannelVolumeEvent, processor: processChannelVolume },
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
