export type Byte = number

export type EventGenerator = Generator<MTrkEvent, void, void>

export enum ChunkType {
  MThd = 'MThd',
  MTrk = 'MTrk'
}

export type Chunk = {
  type: ChunkType
  view: DataView
}

export enum Format {
  Format0 = 0,
  Format1 = 1,
  Format2 = 2
}

export type Header = {
  format: Format
  numberOfTracks: number
  division: { smpteFormat: number; ticksPerFrame: number } | number
}

export enum EventType {
  Midi = 'midi',
  Sysex = 'sysex',
  Meta = 'meta'
}

export type MidiEvent = {
  type: EventType.Midi
  eventType: MidiEventType
  channel: number
  data: Byte
  otherData?: Byte
}

export enum MidiEventType {
  NoteOff = 0x8, // 0x80 to 0x8F
  NoteOn = 0x9, // 0x90 to 0x9F etc.
  AftertouchKeyPressure = 0xa,
  Controller = 0xb,
  ProgramChange = 0xc,
  ChannelPressure = 0xd,
  PitchModulationWheel = 0xe,
  SystemExclusiveMessage = 0xf0,
  SystemExclusiveMessageEnd = 0xf7,
  Meta = 0xff
}

export type SysexEvent = {
  type: EventType.Sysex
  data: ArrayBuffer
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
  dataView: DataView
}

export type Event = MidiEvent | SysexEvent | MetaEvent

export type MTrkEvent = {
  deltaTime: number
  event: Event
}

export type Track = {
  events: MTrkEvent[]
}
