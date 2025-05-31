import {
  MetaEventType,
  MidiChannelVoiceMessageType,
  MidiChunkType,
  MidiControllerChange,
  MidiFileFormat
} from './events'

/** 0-255 */
type Byte = number

export type MidiReader = Generator<MTrkEvent, void, void>

export type MidiChunk = {
  type: MidiChunkType
  view: DataView
}

export type MidiFileHeader = {
  format: MidiFileFormat
  numberOfTracks: number
  division: { smpteFormat: number; ticksPerFrame: number } | number
}

/** Auxiliary Event Classification (implementation-specific) */
export enum EventType {
  /** Channel Voice/Mode Messages */
  Midi = 'midi',
  /** System Exclusive Messages */
  Sysex = 'sysex',
  /** Meta Events (MIDI File specific) */
  Meta = 'meta'
}

/** MIDI Channel Voice/Mode Message (per MIDI 1.0 Specification) */
export type MidiChannelMessage = {
  type: EventType.Midi
  messageType: MidiChannelVoiceMessageType
  /** MIDI Channel (0-15) */
  channel: number
  /** First data byte (note number, controller number, etc.) */
  data1: Byte
  /** Second data byte (velocity, controller value, etc.) - optional for some message types */
  data2?: Byte
}

export type MidiChannelControllerChangeMessage = MidiChannelMessage & {
  data1: MidiControllerChange
}

/** System Exclusive Message (per MIDI 1.0 Specification) */
export type SystemExclusiveMessage = {
  type: EventType.Sysex
  data: DataView<ArrayBufferLike>
}

/** Meta Event (MIDI File Specification) */
export type MetaEvent = {
  type: EventType.Meta
  metaType: MetaEventType
  data: DataView
}

export type MidiTrackEvent = MidiChannelMessage | MetaEvent

/** MTrk Event (MIDI File Specification) - combines delta-time with event */
export type MTrkEvent = {
  deltaTime: number
  event: MidiTrackEvent
}
