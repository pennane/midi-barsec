/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  isChannelPressureEvent,
  isControllerChangeEvent,
  isEffectiveNoteOff,
  isEffectiveNoteOn,
  isMetaEvent,
  isMidiEvent,
  isPercussionEvent,
  isPitchBendEvent,
  isProgramChangeEvent
} from '../lib'
import { Spec } from '../parser'

import { EventProcessor, EventProcessorPredicate } from './models'
import { metaProcessors } from './processors/metaProcessors'
import {
  controllerProcessors,
  voiceMessageProcessors
} from './processors/midiProcessors'
import { percussionProcessors } from './processors/percussion/percussionProcessors'

function matchEvent<IN>(
  ...handlers: EventProcessorPredicate<IN, any>[]
): EventProcessor<IN> {
  return (ctx, event) => {
    for (const [pred, processor] of handlers) {
      if (pred(event)) return processor(ctx, event)
    }
  }
}

const processPercussionEvent = matchEvent(
  [isEffectiveNoteOn, percussionProcessors.noteOn],
  [isEffectiveNoteOff, percussionProcessors.noteOff]
)

const processControllerEvent: EventProcessor<
  Spec.MidiChannelControllerChangeMessage
> = (ctx, event) => {
  const processor = controllerProcessors[event.data1]
  if (!processor) {
    console.info(
      'unhandled controller change event',
      Spec.MidiControllerChange[event.data1]
    )
    return
  }
  return processor(ctx, event)
}

const processMidi: EventProcessor<Spec.MidiChannelMessage> = matchEvent(
  [isControllerChangeEvent, processControllerEvent],
  [isPercussionEvent, processPercussionEvent],
  [isEffectiveNoteOn, voiceMessageProcessors.noteOn],
  [isEffectiveNoteOff, voiceMessageProcessors.noteOff],
  [isPitchBendEvent, voiceMessageProcessors.pitchBend],
  [isChannelPressureEvent, voiceMessageProcessors.channelPressure],
  [isProgramChangeEvent, voiceMessageProcessors.programChange],
  [
    (_): _ is any => true,
    (_, event) =>
      console.info(
        'unhandled midi event',
        Spec.MidiChannelVoiceMessageType[event.messageType]
      )
  ]
)

const processMetaEvent: EventProcessor<Spec.MetaEvent> = (ctx, event) => {
  const processor = metaProcessors[event.metaType]
  if (!processor) {
    console.info('unhandled meta event', Spec.MetaEventType[event.metaType])
    return
  }
  return processor(ctx, event)
}

export const processEvent: EventProcessor<Spec.MidiTrackEvent> = matchEvent(
  [isMidiEvent, processMidi],
  [isMetaEvent, processMetaEvent],
  [
    (_): _ is any => true,
    (_, event) => console.info('unhandled top level event', event)
  ]
)
