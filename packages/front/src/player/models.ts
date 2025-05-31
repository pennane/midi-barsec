import { MidiParser } from '../parser/midiParser'
import { MTrkEvent } from '../spec'

export type MidiPlayerEventMap = {
  progressUpdate: {
    position: number
    duration: number
    currentTime: number
    isPlaying: boolean
  }
}
export type MidiPlayerEventType = keyof MidiPlayerEventMap

export type MidiPlayer = {
  pause: () => void
  play: () => Promise<void>
  position: () => number
  duration: () => number
  isPlaying(): boolean
  seek: (position: number) => void
  load: (midi: MidiParser) => Promise<void>
  addEventListener: <T extends MidiPlayerEventType>(
    type: T,
    listener: (event: CustomEvent<MidiPlayerEventMap[T]>) => void
  ) => void
  removeEventListener: (type: string, listener: EventListener) => void
}

export type Note = {
  gain: GainNode
  oscillator: OscillatorNode
  noteNumber: number
  baseGain: number
  baseFrequency: number
  sustained: boolean
}

export type Instrument = {
  playNote(
    ctx: PlaybackContext,
    channel: Channel,
    opts: { noteNumber: number; velocity: number }
  ): Note
  stopNote(
    ctx: PlaybackContext,
    channel: Channel,
    note: Note,
    opts: { reapplied: boolean }
  ): void
}

export type Channel = {
  gain: GainNode
  panner: StereoPannerNode
  instrument: Instrument
  notes: Map<number, Note>
  sustain: boolean
  /** 0.0–1.0 */
  volume: number
  /** -8192–8192, center 0 */
  pitchBend: number
  /** 0.0–1.0) */
  modulation: number
  /** 0.0–1.0 */
  expression: number
  /** 0.0–1.0 */
  pressure: number
}

export type PlaybackContext = {
  audioContext: AudioContext
  gainNode: GainNode
  channels: Map<number, Channel>
  eventIterator: Iterator<MTrkEvent, void, void>
  division: number
  tickDuration: number
  scheduledTime: number
  startTime: number
}

export type PlayerState = {
  currentMidi: MidiParser | null
  playbackContext: PlaybackContext | null
  isPlaying: boolean
  totalDuration: number
  pausedPosition: number
}

export type EventProcessor<T> = (ctx: PlaybackContext, event: T) => void
export type EventProcessorPredicate<IN, OUT extends IN> = [
  pred: (event: IN) => event is OUT,
  EventProcessor<OUT>
]
