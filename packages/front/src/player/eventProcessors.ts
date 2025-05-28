import {
  isControllerChangeEvent,
  isEffectiveNoteOff,
  isEffectiveNoteOn,
  isMetaEvent,
  isMidiEvent,
  isPercussionEvent,
  isSysexEvent
} from '../lib'
import { MidiChannelMessage, MidiTrackEvent } from '../models'
import { EventProcessor } from './models'
import {
  controllerProcessors,
  voiceMessageProcessors
} from './processors/midiProcessors'
import { percussionProcessors } from './processors/percussion/percussionProcessors'
import { metaProcessors } from './processors/metaProcessors'

const processMidi: EventProcessor<MidiChannelMessage> = (event, ctx, state) => {
  if (isPercussionEvent(event)) {
    if (isEffectiveNoteOn(event)) {
      return percussionProcessors.noteOn(event, ctx, state)
    }
    if (isEffectiveNoteOff(event)) {
      return percussionProcessors.noteOff(event, ctx, state)
    }
    return
  }

  if (isControllerChangeEvent(event)) {
    return controllerProcessors[event.data1]?.(event, ctx, state)
  }

  // return // for debugging

  if (isEffectiveNoteOn(event)) {
    return voiceMessageProcessors.noteOn(event, ctx, state)
  }

  if (isEffectiveNoteOff(event)) {
    return voiceMessageProcessors.noteOff(event, ctx, state)
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
