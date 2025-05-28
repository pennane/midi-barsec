import {
  isControllerChangeEvent,
  isEffectiveNoteOff,
  isEffectiveNoteOn,
  isMetaEvent,
  isMidiEvent,
  isPercussionEvent,
  isPitchBendEvent,
  isSysexEvent
} from '../lib'
import { MidiChannelMessage, MidiTrackEvent } from '../models'
import { EventProcessor } from './models'
import { metaProcessors } from './processors/metaProcessors'
import {
  controllerProcessors,
  voiceMessageProcessors
} from './processors/midiProcessors'
import { percussionProcessors } from './processors/percussion/percussionProcessors'

const processMidi: EventProcessor<MidiChannelMessage> = (event, ctx, state) => {
  if (isControllerChangeEvent(event)) {
    return controllerProcessors[event.data1]?.(event, ctx, state)
  }

  const percussion = isPercussionEvent(event)

  if (isPitchBendEvent(event)) {
    return voiceMessageProcessors.pitchBend(event, ctx, state)
  }

  if (isEffectiveNoteOn(event)) {
    return percussion
      ? percussionProcessors.noteOn(event, ctx, state)
      : voiceMessageProcessors.noteOn(event, ctx, state)
  }

  if (isEffectiveNoteOff(event)) {
    return percussion
      ? percussionProcessors.noteOff(event, ctx, state)
      : voiceMessageProcessors.noteOff(event, ctx, state)
  }
}

export const processEvent: EventProcessor<MidiTrackEvent> = (
  event,
  ctx,
  state
) => {
  if (isSysexEvent(event)) {
    return
  }
  if (isMidiEvent(event)) {
    return processMidi(event, ctx, state)
  }
  if (isMetaEvent(event)) {
    return metaProcessors[event.metaType]?.(event, ctx, state)
  }
}
