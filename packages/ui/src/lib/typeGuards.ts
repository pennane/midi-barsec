import { Spec } from 'parser'

export function isMidiEvent(
  event: Spec.MidiTrackEvent
): event is Spec.MidiChannelMessage {
  return event.type === Spec.EventType.Midi
}

export function isMetaEvent(
  event: Spec.MidiTrackEvent
): event is Spec.MetaEvent {
  return event.type === Spec.EventType.Meta
}

export function isPitchBendEvent(
  event: Spec.MidiTrackEvent
): event is Spec.MidiChannelMessage & {
  messageType: Spec.MidiChannelVoiceMessageType.PitchBendChange
} {
  return (
    isMidiEvent(event) &&
    event.messageType === Spec.MidiChannelVoiceMessageType.PitchBendChange
  )
}

export function isChannelPressureEvent(
  event: Spec.MidiTrackEvent
): event is Spec.MidiChannelMessage & {
  messageType: Spec.MidiChannelVoiceMessageType.ChannelPressure
} {
  return (
    isMidiEvent(event) &&
    event.messageType === Spec.MidiChannelVoiceMessageType.ChannelPressure
  )
}

function isNoteOnEvent(
  event: Spec.MidiTrackEvent
): event is Spec.MidiChannelMessage {
  return (
    isMidiEvent(event) &&
    event.messageType === Spec.MidiChannelVoiceMessageType.NoteOn
  )
}

function isNoteOffEvent(
  event: Spec.MidiTrackEvent
): event is Spec.MidiChannelMessage {
  return (
    isMidiEvent(event) &&
    event.messageType === Spec.MidiChannelVoiceMessageType.NoteOff
  )
}

function isNoteOnWithZeroVelocity(
  event: Spec.MidiTrackEvent
): event is Spec.MidiChannelMessage & { data2: 0 } {
  return isNoteOnEvent(event) && event.data2 === 0
}

export function isEffectiveNoteOff(
  event: Spec.MidiTrackEvent
): event is Spec.MidiChannelMessage &
  (
    | { messageType: Spec.MidiChannelVoiceMessageType.NoteOff }
    | { messageType: Spec.MidiChannelVoiceMessageType.NoteOn; data2: 0 }
  ) {
  return isNoteOffEvent(event) || isNoteOnWithZeroVelocity(event)
}

export function isEffectiveNoteOn(
  event: Spec.MidiTrackEvent
): event is Spec.MidiChannelMessage & {
  messageType: Spec.MidiChannelVoiceMessageType.NoteOn
} {
  return isNoteOnEvent(event) && !isNoteOnWithZeroVelocity(event)
}

export function isControllerChangeEvent(
  event: Spec.MidiTrackEvent
): event is Spec.MidiChannelControllerChangeMessage {
  return (
    isMidiEvent(event) &&
    event.messageType === Spec.MidiChannelVoiceMessageType.ControlChange
  )
}

export function isProgramChangeEvent(
  event: Spec.MidiTrackEvent
): event is Spec.MidiChannelControllerChangeMessage & {
  messageType: Spec.MidiChannelVoiceMessageType.ProgramChange
} {
  return (
    isMidiEvent(event) &&
    event.messageType === Spec.MidiChannelVoiceMessageType.ProgramChange
  )
}

export function isPercussionEvent(
  event: Spec.MidiTrackEvent
): event is Spec.MidiChannelMessage & { channel: 9 } {
  return isMidiEvent(event) && event.channel === 9
}

export function isTempoEvent(
  event: Spec.MidiTrackEvent
): event is Spec.MetaEvent {
  return isMetaEvent(event) && event.metaType === Spec.MetaEventType.SetTempo
}
