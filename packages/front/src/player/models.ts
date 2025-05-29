import { MTrkEvent } from '../models'

export type Note = {
  gain: GainNode
  oscillator: OscillatorNode
  sustained: boolean
}

export type Channel = {
  /** Master channel gain node */
  gain: GainNode
  /** Stereo panner node for positioning audio left/right */
  panner: StereoPannerNode
  /** Active notes keyed by MIDI pitch number */
  notes: Map<number, Note>
  /** Sustain pedal state (true if pedal is down) */
  sustain: boolean
  /** 14-bit pitch bend value (-8192–8192, center 0) */
  pitchBend: number
  /** Current program/instrument number (0–127)  - unused for now*/
  program: number
  /** Modulation wheel value (0.0–1.0) */
  modulation: number
  /** Expression controller value (0.0–1.0) */
  expression: number
  /** Channel pressure / aftertouch value (0.0–1.0) */
  pressure: number
  /** Channel volume controller value (0.0–1.0) */
  volume: number
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
