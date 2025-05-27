/** 0-255 */
type Byte = number

export type MidiReader = Generator<MTrkEvent, void, void>

/** MIDI File Structure Types (per MIDI File Specification) */
export enum MidiChunkType {
  /** Header chunk */
  MThd = 'MThd',
  /** Track chunk */
  MTrk = 'MTrk'
}

export type MidiChunk = {
  type: MidiChunkType
  view: DataView
}

/** MIDI File Format Types (per MIDI File Specification) */
export enum MidiFileFormat {
  /** Single multi-channel track */
  Format0 = 0,
  /** Multiple simultaneous tracks */
  Format1 = 1,
  /** Multiple independent patterns */
  Format2 = 2
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

/** MIDI Channel Voice Message Types (per MIDI 1.0 Specification) */
export enum MidiChannelVoiceMessageType {
  /** 0x80-0x8F Note Off */
  NoteOff = 0x8,
  /** 0x90-0x9F Note On */
  NoteOn = 0x9,
  /** 0xA0-0xAF Polyphonic Key Pressure (Aftertouch) */
  PolyphonicKeyPressure = 0xa,
  /** 0xB0-0xBF Control Change */
  ControlChange = 0xb,
  /** 0xC0-0xCF Program Change */
  ProgramChange = 0xc,
  /** 0xD0-0xDF Channel Pressure (Aftertouch) */
  ChannelPressure = 0xd,
  /** 0xE0-0xEF Pitch Bend Change */
  PitchBendChange = 0xe,
  /** Meta Event marker (MIDI File specific) */
  Meta = 0xff
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

/** System Exclusive Message (per MIDI 1.0 Specification) */
export type SystemExclusiveMessage = {
  type: EventType.Sysex
  data: DataView<ArrayBufferLike>
}

/** Meta Event Types (MIDI File Specification) */
export enum MetaEventType {
  SequenceNumber = 0x00,
  TextEvent = 0x01,
  CopyrightNotice = 0x02,
  SequenceTrackName = 0x03,
  InstrumentName = 0x04,
  Lyric = 0x05,
  Marker = 0x06,
  CuePoint = 0x07,
  MidiChannelPrefix = 0x20,
  EndOfTrack = 0x2f,
  SetTempo = 0x51,
  SmpteOffset = 0x54,
  TimeSignature = 0x58,
  KeySignature = 0x59,
  SequencerSpecific = 0x7f
}

/** Meta Event (MIDI File Specification) */
export type MetaEvent = {
  type: EventType.Meta
  metaType: MetaEventType
  data: DataView
}

/** Union type for all MIDI Track Events */
export type MidiTrackEvent =
  | MidiChannelMessage
  | SystemExclusiveMessage
  | MetaEvent

/** MTrk Event (MIDI File Specification) - combines delta-time with event */
export type MTrkEvent = {
  deltaTime: number
  event: MidiTrackEvent
}
