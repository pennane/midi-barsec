import {
  isControllerChangeEvent,
  isEffectiveNoteOff,
  isMetaEvent,
  isMidiEvent,
  isNoteOnEvent,
  isPercussionEvent,
  isSysexEvent
} from '../lib'
import { noop } from '../lib/fp'
import {
  MetaEvent,
  MidiChannelControllerChangeMessage,
  MidiChannelMessage,
  MidiChannelVoiceMessageType,
  MidiTrackEvent
} from '../models'
import { EventProcessor, ProcessorPredicate } from './models'
import {
  controllerProcessors,
  voiceMessageProcessors
} from './processors/midiProcessors'
import { metaProcessors } from './processors/metaProcessors'
import { predicateProcessor } from './processors/lib'

const processControllerChange: EventProcessor<
  MidiChannelControllerChangeMessage
> = (event, ctx, state) =>
  controllerProcessors[event.data1 as keyof typeof controllerProcessors]?.(
    event,
    ctx,
    state
  )

const midiChannelMessagePredicates = [
  { predicate: isPercussionEvent, processor: noop },
  {
    predicate: isEffectiveNoteOff,
    processor: voiceMessageProcessors[MidiChannelVoiceMessageType.NoteOn]
  },
  {
    predicate: isNoteOnEvent,
    processor: voiceMessageProcessors[MidiChannelVoiceMessageType.NoteOff]
  },
  {
    predicate: isControllerChangeEvent,
    processor: processControllerChange
  }
] as const satisfies ProcessorPredicate<MidiChannelMessage, any>[]

const processMidi = predicateProcessor(midiChannelMessagePredicates)

const processMeta: EventProcessor<MetaEvent> = (event, ctx, state) =>
  metaProcessors[event.metaType as keyof typeof metaProcessors]?.(
    event,
    ctx,
    state
  )

const rootPredicates = [
  {
    predicate: isMidiEvent,
    processor: processMidi
  },
  {
    predicate: isMetaEvent,
    processor: processMeta
  },
  {
    predicate: isSysexEvent,
    processor: noop
  }
] as const satisfies ProcessorPredicate<MidiTrackEvent, any>[]

export const processEvent = predicateProcessor(rootPredicates)
