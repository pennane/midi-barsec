import { MidiParser, Spec } from 'parser'

export type MidiPlayerEventMap = {
  progressUpdate: {
    position: number
    duration: number
    currentTime: number
    isPlaying: boolean
  }
  announcement: {
    type: Spec.MetaEventType
    text: string
  }
}
export type MidiPlayerEventType = keyof MidiPlayerEventMap

export type MidiPlayerStrategies = {
  percussion: { type: 'enabled' } | { type: 'disabled' }
  instruments:
    | { type: 'instruments' }
    | { type: 'fixed'; instrument: Instrument; name: string }
    | { type: 'disabled' }
  controllers: { type: 'enabled' } | { type: 'disabled' }
}

export type MidiPlayer = {
  pause: () => void
  play: () => Promise<void>
  position: () => MidiPlayerEventMap['progressUpdate']
  duration: () => number
  isPlaying(): boolean
  seek: (position: number) => void
  load: (midi: MidiParser) => Promise<MidiPlayer>
  addEventListener: <T extends MidiPlayerEventType>(
    type: T,
    listener: (event: CustomEvent<MidiPlayerEventMap[T]>) => void
  ) => void
  removeEventListener: (type: string, listener: EventListener) => void
  updateStrategies: (strategies: Partial<MidiPlayerStrategies>) => void
  currentStrategies(): MidiPlayerStrategies
}

export type Note = {
  gain: GainNode
  oscillator: OscillatorNode
  noteNumber: number
  baseGain: number
  baseFrequency: number
  sustained: boolean
}

export type PercussionNote = {
  source: OscillatorNode | AudioBufferSourceNode
  gain: GainNode
  filter?: BiquadFilterNode
  startTime: number
  duration: number
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
  instrument: (ctx: PlaybackContext) => Instrument
  updateProgram: (programNumber: Spec.GeneralMidiInstrument.Instrument) => void
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
  strategies: MidiPlayerStrategies
  audioContext: AudioContext
  gainNode: GainNode
  channels: Map<number, Channel>
  eventIterator: Iterator<Spec.MTrkEvent, void, void>
  division: number
  tickDuration: number
  scheduledTime: number
  startTime: number
  emit: <T extends MidiPlayerEventType>(
    type: T,
    detail: MidiPlayerEventMap[T]
  ) => void
}

export type PlayerState = {
  midi: MidiParser
  playbackContext: PlaybackContext | null
  isPlaying: boolean
  pausedPosition: number
}

export type EventProcessor<T> = (ctx: PlaybackContext, event: T) => void
export type EventProcessorPredicate<IN, OUT extends IN> = [
  pred: (event: IN) => event is OUT,
  EventProcessor<OUT>
]
