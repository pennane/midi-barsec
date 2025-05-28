import {
  isControllerChangeEvent,
  isEffectiveNoteOff,
  isEffectiveNoteOn,
  isMetaEvent,
  isMidiEvent,
  isPercussionEvent,
  isSysexEvent
} from '../lib'
import { MetaEvent, MidiChannelMessage, MidiTrackEvent } from '../models'
import { EventProcessor } from './models'
import {
  controllerProcessors,
  voiceMessageProcessors
} from './processors/midiProcessors'
import { metaProcessors } from './processors/metaProcessors'

const processMidi: EventProcessor<MidiChannelMessage> = (event, ctx, state) => {
  if (isPercussionEvent(event)) return
  if (isControllerChangeEvent(event)) {
    return controllerProcessors[event.data1]?.(event, ctx, state)
  }
  if (isEffectiveNoteOn(event)) {
    return voiceMessageProcessors.noteOn(event, ctx, state)
  }
  if (isEffectiveNoteOff(event)) {
    return voiceMessageProcessors.noteOff(event, ctx, state)
  }
}

const processMeta: EventProcessor<MetaEvent> = (event, ctx, state) =>
  metaProcessors[event.metaType as keyof typeof metaProcessors]?.(
    event,
    ctx,
    state
  )

export const processEvent: EventProcessor<MidiTrackEvent> = (
  event,
  ctx,
  state
) => {
  if (isSysexEvent(event)) return
  if (isMidiEvent(event)) return processMidi(event, ctx, state)
  if (isMetaEvent(event)) return processMeta(event, ctx, state)
}
