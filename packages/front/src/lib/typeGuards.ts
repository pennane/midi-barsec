import {
  EventType,
  MetaEventType,
  MidiEventType,
  MidiTrackEvent,
  MidiEvent,
  MetaEvent,
  SysexEvent
} from '../models'

export function isMidiEvent(event: MidiTrackEvent): event is MidiEvent {
  return event.type === EventType.Midi
}

export function isMetaEvent(event: MidiTrackEvent): event is MetaEvent {
  return event.type === EventType.Meta
}

export function isSysexEvent(event: MidiTrackEvent): event is SysexEvent {
  return event.type === EventType.Sysex
}

export function isNoteOnEvent(event: MidiTrackEvent): event is MidiEvent {
  return isMidiEvent(event) && event.eventType === MidiEventType.NoteOn
}

export function isNoteOffEvent(event: MidiTrackEvent): event is MidiEvent {
  return isMidiEvent(event) && event.eventType === MidiEventType.NoteOff
}

export function isNoteOnWithZeroVelocity(
  event: MidiTrackEvent
): event is MidiEvent {
  return isNoteOnEvent(event) && event.otherData === 0
}

export function isEffectiveNoteOff(event: MidiTrackEvent): event is MidiEvent {
  return isNoteOffEvent(event) || isNoteOnWithZeroVelocity(event)
}

export function isProgramChangeEvent(
  event: MidiTrackEvent
): event is MidiEvent {
  return isMidiEvent(event) && event.eventType === MidiEventType.ProgramChange
}

export function isTempoEvent(event: MidiTrackEvent): event is MetaEvent {
  return isMetaEvent(event) && event.metaType === MetaEventType.Tempo
}

export function isEndOfTrackEvent(event: MidiTrackEvent): event is MetaEvent {
  return isMetaEvent(event) && event.metaType === MetaEventType.EndOfTrack
}

export function isTextEvent(event: MidiTrackEvent): event is MetaEvent {
  return isMetaEvent(event) && event.metaType === MetaEventType.TextEvent
}
