import { readVariableLengthQuantity } from '../lib'
import {
  EventType,
  MetaEvent,
  MidiChannelMessage,
  MidiChannelVoiceMessageType,
  MidiTrackEvent,
  SystemExclusiveMessage
} from './spec'

type Result<T> = {
  event: T
  byteLength: number
}

type StatusRange = { from: number; to: number }

type EventReader = (
  view: DataView,
  ptr: number,
  statusByte: number
) => Result<MidiTrackEvent | SystemExclusiveMessage>

type ReaderPredicate =
  | { type: 'exact'; status: number; reader: EventReader }
  | { type: 'range'; range: StatusRange; reader: EventReader }

const createResult = <T extends MidiTrackEvent | SystemExclusiveMessage>(
  event: T,
  byteLength: number
): Result<T> => ({ event, byteLength })

function readSysexEvent(
  view: DataView,
  pointer: number
): Result<SystemExclusiveMessage> {
  const { value: length, length: lenLength } = readVariableLengthQuantity(
    view,
    pointer
  )

  const byteLength = lenLength + length

  return createResult(
    {
      type: EventType.Sysex,
      data: new DataView(
        view.buffer,
        view.byteOffset + pointer + lenLength,
        length
      )
    },
    byteLength
  )
}

function readMetaEvent(view: DataView, pointer: number): Result<MetaEvent> {
  const metaType = view.getUint8(pointer)
  const { value: length, length: lenLength } = readVariableLengthQuantity(
    view,
    pointer + 1
  )

  const dataStart = pointer + 1 + lenLength
  const data = new DataView(view.buffer, view.byteOffset + dataStart, length)

  const byteLength = 1 + lenLength + length

  return createResult(
    {
      type: EventType.Meta,
      metaType,
      data
    },
    byteLength
  )
}

function readMidiEvent(
  view: DataView,
  pointer: number,
  statusByte: number
): Result<MidiChannelMessage> {
  const messageType = (statusByte >> 4) & 0x0f
  const channel = statusByte & 0x0f
  const data1 = view.getUint8(pointer)

  const hasTwoBytes =
    messageType !== MidiChannelVoiceMessageType.ProgramChange &&
    messageType !== MidiChannelVoiceMessageType.ChannelPressure

  const data2 = hasTwoBytes ? view.getUint8(pointer + 1) : undefined
  const byteLength = hasTwoBytes ? 2 : 1

  return createResult(
    {
      type: EventType.Midi,
      messageType,
      channel,
      data1,
      data2
    },
    byteLength
  )
}

const eventReaders: Array<ReaderPredicate> = [
  { type: 'exact', status: 0xff, reader: readMetaEvent },
  { type: 'range', range: { from: 0xf0, to: 0xfe }, reader: readSysexEvent },
  {
    type: 'range',
    range: { from: 0x80, to: 0xef },
    reader: readMidiEvent
  }
]

const selectEventReader = (statusByte: number) => {
  const reader = eventReaders.find((p) =>
    p.type === 'exact'
      ? p.status === statusByte
      : statusByte >= p.range.from && statusByte <= p.range.to
  )?.reader
  if (!reader) {
    throw new Error(`Unknown event type 0x${statusByte.toString(16)}`)
  }

  return reader
}

export function readEvent(
  view: DataView,
  byteOffset: number,
  lastStatusByte: number
) {
  let pointer = byteOffset
  const { value: deltaTime, length: deltaLength } = readVariableLengthQuantity(
    view,
    pointer
  )
  pointer += deltaLength

  let statusByte = view.getUint8(pointer)
  let isRunningStatus = false

  if (statusByte < 0x80) {
    if (lastStatusByte === 0) {
      throw new Error('Running status used without a previous status byte')
    }
    statusByte = lastStatusByte
    isRunningStatus = true
  }

  if (!isRunningStatus) {
    pointer++
  }

  const reader = selectEventReader(statusByte)

  const { event, byteLength } = reader(view, pointer, statusByte)

  return {
    event,
    deltaTime,
    statusByte,
    byteLength: deltaLength + (isRunningStatus ? 0 : 1) + byteLength
  }
}
