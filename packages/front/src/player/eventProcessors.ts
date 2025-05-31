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

const processMidi: EventProcessor<MidiChannelMessage> = (ctx, event) => {
  if (isControllerChangeEvent(event)) {
    const processor = controllerProcessors[event.data1]
    if (!processor) {
      return console.info(
        'unhandled controller change event',
        MidiControllerChange[event.data1]
      )
    }

    return processor(ctx, event)
  }

  if (isPercussionEvent(event)) {
    if (isEffectiveNoteOn(event)) {
      return percussionProcessors.noteOn(ctx, event)
    }

    if (isEffectiveNoteOff(event)) {
      return percussionProcessors.noteOff(ctx, event)
    }

    return
  }

  if (isEffectiveNoteOn(event)) {
    return voiceMessageProcessors.noteOn(ctx, event)
  }

  if (isEffectiveNoteOff(event)) {
    return voiceMessageProcessors.noteOff(ctx, event)
  }

  if (isPitchBendEvent(event)) {
    return voiceMessageProcessors.pitchBend(ctx, event)
  }

  if (isChannelPressureEvent(event)) {
    return voiceMessageProcessors.channelPressure(ctx, event)
  }
  console.info(
    'unhandled midi event',
    MidiChannelVoiceMessageType[event.messageType]
  )
}

export const processEvent: EventProcessor<MidiTrackEvent> = (ctx, event) => {
  if (isMidiEvent(event)) {
    return processMidi(ctx, event)
  }
  if (isMetaEvent(event)) {
    const processor = metaProcessors[event.metaType]
    if (!processor) {
      console.info('unhandled meta event', MetaEventType[event.metaType], event)
      return
    }
    return processor(ctx, event)
  }
  console.info('unhandled top level event', event)
}
