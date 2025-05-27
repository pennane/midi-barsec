/** 0-255 */
type Byte = number

export type MidiReader = Generator<MTrkEvent, void, void>

export enum MidiChunkType {
  MThd = 'MThd',
  MTrk = 'MTrk'
}

export type MidiChunk = {
  type: MidiChunkType
  view: DataView
}

enum FormatType {
  Format0 = 0,
  Format1 = 1,
  Format2 = 2
}

export type Header = {
  format: FormatType
  numberOfTracks: number
  division: { smpteFormat: number; ticksPerFrame: number } | number
}

export enum EventType {
  Midi = 'midi',
  Sysex = 'sysex',
  Meta = 'meta'
}

export enum MidiEventType {
  NoteOff = 0x8, // 0x80 to 0x8F
  NoteOn = 0x9, // 0x90 to 0x9F etc.
  AftertouchKeyPressure = 0xa,
  Controller = 0xb,
  ProgramChange = 0xc,
  ChannelPressure = 0xd,
  PitchModulationWheel = 0xe,
  Meta = 0xff
}

export type MidiEvent = {
  type: EventType.Midi
  eventType: MidiEventType
  channel: number
  data: Byte
  otherData?: Byte
}

export type SysexEvent = {
  type: EventType.Sysex
  data: DataView<ArrayBufferLike>
}

export enum MetaEventType {
  SequenceNumber = 0x00,
  TextEvent = 0x01,
  EndOfTrack = 0x2f,
  Tempo = 0x51
}

export type MetaEvent = {
  type: EventType.Meta
  metaType: MetaEventType
  data: DataView
}

export type MidiTrackEvent = MidiEvent | SysexEvent | MetaEvent

export type MTrkEvent = {
  deltaTime: number
  event: MidiTrackEvent
}
