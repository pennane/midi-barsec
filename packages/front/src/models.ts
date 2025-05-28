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

/** MIDI Control Change Numbers (per MIDI 1.0 Specification) */
export enum MidiControllerChange {
  BankSelectMSB = 0,
  ModulationWheelMSB = 1,
  BreathControllerMSB = 2,
  FootControllerMSB = 4,
  PortamentoTimeMSB = 5,
  DataEntryMSB = 6,
  ChannelVolumeMSB = 7,
  BalanceMSB = 8,
  PanMSB = 10,
  ExpressionControllerMSB = 11,
  EffectControl1MSB = 12,
  EffectControl2MSB = 13,
  GeneralPurpose1MSB = 16,
  GeneralPurpose2MSB = 17,
  GeneralPurpose3MSB = 18,
  GeneralPurpose4MSB = 19,
  BankSelectLSB = 32,
  ModulationWheelLSB = 33,
  BreathControllerLSB = 34,
  FootControllerLSB = 36,
  PortamentoTimeLSB = 37,
  DataEntryLSB = 38,
  ChannelVolumeLSB = 39,
  BalanceLSB = 40,
  PanLSB = 42,
  ExpressionControllerLSB = 43,
  EffectControl1LSB = 44,
  EffectControl2LSB = 45,
  GeneralPurpose1LSB = 48,
  GeneralPurpose2LSB = 49,
  GeneralPurpose3LSB = 50,
  GeneralPurpose4LSB = 51,
  SustainPedal = 64,
  PortamentoOnOff = 65,
  SostenutoOnOff = 66,
  SoftPedalOnOff = 67,
  LegatoFootswitch = 68,
  Hold2 = 69,
  SoundController1 = 70,
  SoundController2 = 71,
  SoundController3 = 72,
  SoundController4 = 73,
  SoundController5 = 74,
  SoundController6 = 75,
  SoundController7 = 76,
  SoundController8 = 77,
  SoundController9 = 78,
  SoundController10 = 79,
  GeneralPurpose5 = 80,
  GeneralPurpose6 = 81,
  GeneralPurpose7 = 82,
  GeneralPurpose8 = 83,
  PortamentoControl = 84,
  HighResolutionVelocityPrefix = 88,
  Effects1Depth = 91,
  Effects2Depth = 92,
  Effects3Depth = 93,
  Effects4Depth = 94,
  Effects5Depth = 95,
  DataIncrement = 96,
  DataDecrement = 97,
  NonRegisteredParameterLSB = 98,
  NonRegisteredParameterMSB = 99,
  RegisteredParameterLSB = 100,
  RegisteredParameterMSB = 101,
  AllSoundOff = 120,
  ResetAllControllers = 121,
  LocalControlOnOff = 122,
  AllNotesOff = 123,
  OmniModeOff = 124,
  OmniModeOn = 125,
  MonoModeOn = 126,
  PolyModeOn = 127
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
