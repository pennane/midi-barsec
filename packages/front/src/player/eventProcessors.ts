import {
  calculateTickDuration,
  isControllerChangeEvent,
  isEffectiveNoteOff,
  isMetaEvent,
  isNoteOnEvent,
  isPercussionEvent,
  midiNoteToFrequency,
  readUint24BE
} from '../lib'
import { noop } from '../lib/fp'
import {
  MetaEvent,
  MetaEventType,
  MidiChannelMessage,
  MidiTrackEvent,
  MTrkEvent
} from '../models'
import { announce } from '../ui/textAnnouncer'

type Note = {
  gain: GainNode
  oscillator: OscillatorNode
  sustained: boolean
}

type Channel = {
  gain: GainNode
  panner: StereoPannerNode
  notes: Map<number, Note>
  sustain: boolean
}

type PlaybackState = {
  tickDuration: number
  scheduledTime: number
  channels: Map<number, Channel>
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

function getOrCreateChannel(
  state: PlaybackState,
  ctx: PlaybackContext,
  channelIndex: number
): Channel {
  let channel = state.channels.get(channelIndex)
  if (channel) return channel

  const gain = ctx.audioContext.createGain()
  const panner = ctx.audioContext.createStereoPanner()
  panner.connect(gain)
  gain.connect(ctx.gainNode)
  gain.connect(ctx.analyserNode)

  channel = {
    gain,
    panner,
    notes: new Map(),
    sustain: false
  }
  state.channels.set(channelIndex, channel)

  return channel
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
  const channel = getOrCreateChannel(state, ctx, event.channel)
  const velocity = (event.data2 ?? 0) / 127
  const existingNote = channel.notes.get(event.data1)
  if (existingNote?.sustained) {
    existingNote.gain.gain.setValueAtTime(velocity, state.scheduledTime)
    return
  }

  if (existingNote) {
    try {
      existingNote.oscillator.stop(state.scheduledTime)
    } catch {}
    existingNote.oscillator.disconnect()
    existingNote.gain.disconnect()
    channel.notes.delete(event.data1)
  }

  const oscillator = ctx.audioContext.createOscillator()
  const gain = ctx.audioContext.createGain()

  gain.gain.setValueAtTime(velocity, state.scheduledTime)
  oscillator.type = ctx.waveform
  oscillator.frequency.setValueAtTime(
    midiNoteToFrequency(event.data1),
    state.scheduledTime
  )

  oscillator.connect(gain)
  gain.connect(channel.panner)

  oscillator.start(state.scheduledTime)

  channel.notes.set(event.data1, {
    oscillator,
    gain,
    sustained: false
  })
}

function processNoteOff(
  event: MidiChannelMessage,
  ctx: PlaybackContext,
  state: PlaybackState
): void {
  const channel = getOrCreateChannel(state, ctx, event.channel)
  const note = channel.notes.get(event.data1)
  if (!note) return
  if (channel.sustain) {
    note.sustained = true
  } else {
    note.oscillator.stop(state.scheduledTime)
    channel.notes.delete(event.data1)
  }
}

function processSustainPedal(
  event: MidiChannelMessage,
  ctx: PlaybackContext,
  state: PlaybackState
): void {
  if (event.data2 === undefined) return
  const isDown = event.data2 >= 64
  const channel = getOrCreateChannel(state, ctx, event.channel)

  channel.sustain = isDown
  if (isDown) {
    return
  }

  for (const [key, note] of channel.notes.entries()) {
    if (note.sustained) {
      note.oscillator.stop(state.scheduledTime)
      channel.notes.delete(key)
    }
  }
}

function processPan(
  event: MidiChannelMessage,
  ctx: PlaybackContext,
  state: PlaybackState
): void {
  const channel = getOrCreateChannel(state, ctx, event.channel)

  if (!channel || event.data2 === undefined) return

  const pan = (event.data2 - 64) / 64 // Convert 0–127 to -1.0–1.0
  channel.panner.pan.setValueAtTime(pan, state.scheduledTime)
}

function processResetControllers(
  event: MidiChannelMessage,
  _ctx: PlaybackContext,
  state: PlaybackState
): void {
  const channel = state.channels.get(event.channel)
  if (!channel) return

  channel.sustain = false
  channel.panner.pan.setValueAtTime(0, state.scheduledTime)
  channel.gain.gain.setValueAtTime(1, state.scheduledTime)
}

function processChannelVolume(
  event: MidiChannelMessage,
  ctx: PlaybackContext,
  state: PlaybackState
): void {
  if (event.data2 === undefined) return
  const channel = getOrCreateChannel(state, ctx, event.channel)

  const volume = event.data2 / 127
  channel.gain.gain.setValueAtTime(volume, state.scheduledTime)
}

const processControllerChange: EventProcessor<MidiChannelMessage> = (
  event,
  ctx,
  state
) => {
  switch (event.data1) {
    case 7:
      return processChannelVolume(event, ctx, state)
    case 10:
      return processPan(event, ctx, state)
    case 64:
      return processSustainPedal(event, ctx, state)
    case 121:
      return processResetControllers(event, ctx, state)
    default:
      return noop()
  }
}

function processLyric(
  event: MetaEvent,
  _ctx: PlaybackContext,
  _state: PlaybackState
): void {
  const text = new TextDecoder().decode(event.data)
  announce(text)
}

const processMeta: EventProcessor<MetaEvent> = (event, ctx, state) => {
  switch (event.metaType) {
    case MetaEventType.SetTempo:
      return processTempoChange(event, ctx, state)
    case MetaEventType.Lyric:
      return processLyric(event, ctx, state)
    default:
      return noop()
  }
}

/**
 * REMINDER ARTTU: ORDER MATTERS HERE :D
 */
const eventProcessors = [
  { predicate: isPercussionEvent, processor: noop },
  {
    predicate: isEffectiveNoteOff,
    processor: processNoteOff
  },
  {
    predicate: isNoteOnEvent,
    processor: processNoteOn
  },
  { predicate: isControllerChangeEvent, processor: processControllerChange },
  {
    predicate: isMetaEvent,
    processor: processMeta
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
