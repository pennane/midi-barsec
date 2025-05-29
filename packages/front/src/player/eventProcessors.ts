import {
  isChannelPressureEvent,
  isControllerChangeEvent,
  isEffectiveNoteOff,
  isEffectiveNoteOn,
  isMetaEvent,
  isMidiEvent,
  isPercussionEvent,
  isPitchBendEvent
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

  if (isPercussionEvent(event)) {
    if (isEffectiveNoteOn(event)) {
      return percussionProcessors.noteOn(event, ctx, state)
    }

    if (isEffectiveNoteOff(event)) {
      return percussionProcessors.noteOff(event, ctx, state)
    }

    return
  }

  if (isEffectiveNoteOn(event)) {
    return voiceMessageProcessors.noteOn(event, ctx, state)
  }

  if (isEffectiveNoteOff(event)) {
    return voiceMessageProcessors.noteOff(event, ctx, state)
  }

  if (isPitchBendEvent(event)) {
    return voiceMessageProcessors.pitchBend(event, ctx, state)
  }

  if (isChannelPressureEvent(event)) {
    return voiceMessageProcessors.channelPressure(event, ctx, state)
  }
}

export const processEvent: EventProcessor<MidiTrackEvent> = (
  event,
  ctx,
  state
) => {
  if (isMidiEvent(event)) {
    return processMidi(event, ctx, state)
  }
  if (isMetaEvent(event)) {
    return metaProcessors[event.metaType]?.(event, ctx, state)
  }
}
