import {
  EventType,
  MetaEvent,
  MetaEventType,
  MidiChannelMessage,
  MidiChannelVoiceMessageType,
  MidiTrackEvent,
  SystemExclusiveMessage
} from '../models'

export function isMidiEvent(
  event: MidiTrackEvent
): event is MidiChannelMessage {
  return event.type === EventType.Midi
}

export function isMetaEvent(event: MidiTrackEvent): event is MetaEvent {
  return event.type === EventType.Meta
}

export function isSysexEvent(
  event: MidiTrackEvent
): event is SystemExclusiveMessage {
  return event.type === EventType.Sysex
}

export function isNoteOnEvent(
  event: MidiTrackEvent
): event is MidiChannelMessage {
  return (
    isMidiEvent(event) &&
    event.messageType === MidiChannelVoiceMessageType.NoteOn
  )
}

export function isNoteOffEvent(
  event: MidiTrackEvent
): event is MidiChannelMessage {
  return (
    isMidiEvent(event) &&
    event.messageType === MidiChannelVoiceMessageType.NoteOff
  )
}

export function isNoteOnWithZeroVelocity(
  event: MidiTrackEvent
): event is MidiChannelMessage {
  return isNoteOnEvent(event) && event.data2 === 0
}

export function isEffectiveNoteOff(
  event: MidiTrackEvent
): event is MidiChannelMessage {
  return isNoteOffEvent(event) || isNoteOnWithZeroVelocity(event)
}

export function isProgramChangeEvent(
  event: MidiTrackEvent
): event is MidiChannelMessage {
  return (
    isMidiEvent(event) &&
    event.messageType === MidiChannelVoiceMessageType.ProgramChange
  )
}

export function isControllerChangeEvent(
  event: MidiTrackEvent
): event is MidiChannelMessage {
  return (
    isMidiEvent(event) &&
    event.messageType === MidiChannelVoiceMessageType.ControlChange
  )
}

export function isPercussionEvent(
  event: MidiTrackEvent
): event is MidiChannelMessage {
  return isMidiEvent(event) && event.channel === 9
}

export function isTempoEvent(event: MidiTrackEvent): event is MetaEvent {
  return isMetaEvent(event) && event.metaType === MetaEventType.SetTempo
}

export function isEndOfTrackEvent(event: MidiTrackEvent): event is MetaEvent {
  return isMetaEvent(event) && event.metaType === MetaEventType.EndOfTrack
}

export function isEffectiveTextEvent(
  event: MidiTrackEvent
): event is MetaEvent {
  return (
    isMetaEvent(event) &&
    (event.metaType === MetaEventType.TextEvent ||
      event.metaType === MetaEventType.CopyrightNotice ||
      event.metaType === MetaEventType.SequenceTrackName ||
      event.metaType === MetaEventType.InstrumentName ||
      event.metaType === MetaEventType.Lyric ||
      event.metaType === MetaEventType.Marker ||
      event.metaType === MetaEventType.CuePoint)
  )
}
