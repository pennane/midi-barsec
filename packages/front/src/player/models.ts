import { MTrkEvent } from '../models'

export type Note = {
  gain: GainNode
  oscillator: OscillatorNode
  baseGain: number
  baseFrequency: number
  sustained: boolean
}

export type Channel = {
  gain: GainNode
  panner: StereoPannerNode
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

export type PlaybackState = {
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

export type PlaybackContext = {
  audioContext: AudioContext
  gainNode: GainNode
  analyserNode: AnalyserNode
  division: number
  waveform: OscillatorType
  percussion: boolean
}

export type EventProcessor<T> = (
  event: T,
  ctx: PlaybackContext,
  state: PlaybackState
) => void

export type ProcessorPredicate<IN, OUT extends IN> = {
  predicate: (event: IN) => event is OUT
  processor: EventProcessor<OUT>
}
