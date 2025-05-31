import { MTrkEvent } from '../spec'

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
  analyserNode: AnalyserNode
  waveform: OscillatorType
  channels: Map<number, Channel>
  eventIterator: Iterator<MTrkEvent, void, void>
  division: number
  tickDuration: number
  includePercussion: boolean
  scheduledTime: number
  startTime: number
  animationFrameId?: number
}

export type EventProcessor<T> = (ctx: PlaybackContext, event: T) => void

export type ProcessorPredicate<IN, OUT extends IN> = {
  predicate: (event: IN) => event is OUT
  processor: EventProcessor<OUT>
}
