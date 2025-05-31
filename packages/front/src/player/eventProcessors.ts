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
import {
  MetaEventType,
  MidiChannelMessage,
  MidiChannelVoiceMessageType,
  MidiControllerChange,
  MidiTrackEvent
} from '../spec'

import { EventProcessor } from './models'
import { metaProcessors } from './processors/metaProcessors'
import {
  controllerProcessors,
  voiceMessageProcessors
} from './processors/midiProcessors'
import { percussionProcessors } from './processors/percussion/percussionProcessors'

const processMidi: EventProcessor<MidiChannelMessage> = (event, ctx, state) => {
  if (isControllerChangeEvent(event)) {
    const processor = controllerProcessors[event.data1]
    if (!processor) {
      return console.log(
        'unhandled controller change event',
        MidiControllerChange[event.data1]
      )
    }

    return processor(event, ctx, state)
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
  console.log(
    'unhandled midi event',
    MidiChannelVoiceMessageType[event.messageType]
  )
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
    const processor = metaProcessors[event.metaType]
    if (!processor) {
      console.log('unhandled meta event', MetaEventType[event.metaType], event)
      return
    }
    return processor(event, ctx, state)
  }
  console.log('unhandled top level event', event)
}
