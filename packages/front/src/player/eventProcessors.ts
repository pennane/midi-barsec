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

import {
  EventProcessor,
  EventProcessorPredicate,
  PlaybackContext
} from './models'
import { metaProcessors } from './processors/metaProcessors'
import {
  createControllerProcessors,
  createVoiceMessageProcessors
} from './processors/midiProcessors'
import { createPercussionProcessors } from './processors/percussion/percussionProcessors'

function matchEvent<IN>(
  ...handlers: EventProcessorPredicate<IN, any>[]
): EventProcessor<IN> {
  return (ctx, event) => {
    for (const [pred, processor] of handlers) {
      if (pred(event)) return processor(ctx, event)
    }
  }
}

function createProcessPercussionEvent(ctx: PlaybackContext) {
  const percussionProcessors = createPercussionProcessors(
    ctx.strategies.percussion
  )
  return matchEvent(
    [isEffectiveNoteOn, percussionProcessors.noteOn],
    [isEffectiveNoteOff, percussionProcessors.noteOff]
  )
}

function createProcessControllerEvent(
  ctx: PlaybackContext
): EventProcessor<Spec.MidiChannelControllerChangeMessage> {
  const controllerProcessors = createControllerProcessors(
    ctx.strategies.controllers
  )
  return (ctx, event) => {
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
}

function createProcessMidi(
  ctx: PlaybackContext
): EventProcessor<Spec.MidiChannelMessage> {
  const voiceMessageProcessors = createVoiceMessageProcessors(
    ctx.strategies.instruments
  )
  const processPercussionEvent = createProcessPercussionEvent(ctx)
  const processControllerEvent = createProcessControllerEvent(ctx)

  return matchEvent(
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
}

const processMetaEvent: EventProcessor<Spec.MetaEvent> = (ctx, event) => {
  const processor = metaProcessors[event.metaType]
  if (!processor) {
    console.info('unhandled meta event', Spec.MetaEventType[event.metaType])
    return
  }
  return processor(ctx, event)
}

export const processEvent: EventProcessor<Spec.MidiTrackEvent> = (
  ctx,
  event
) => {
  const processMidi = createProcessMidi(ctx)

  const processor = matchEvent(
    [isMidiEvent, processMidi],
    [isMetaEvent, processMetaEvent],
    [
      (_): _ is any => true,
      (_, event) => console.info('unhandled top level event', event)
    ]
  )

  return processor(ctx, event)
}
