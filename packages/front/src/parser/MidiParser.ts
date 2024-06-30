import {
  Chunk,
  ChunkType,
  Header,
  Event,
  MidiEventType,
  EventType,
  SysexEvent,
  MidiEvent,
  MetaEvent,
  EventGenerator
} from '../models'

// Spagu version that merges all tracks into one track
// Maybe fix later and actually support other events than note on / off and tempo change

function readVariableLengthQuantity(
  view: DataView,
  offset: number
): { value: number; length: number } {
  let value = 0
  let length = 0

  let currentByte

  do {
    currentByte = view.getUint8(offset + length)
    let sevenBits = currentByte & 0x7f
    value = (value << 7) | sevenBits
    length++
  } while (currentByte & 0x80)

  return { value, length }
}

function parseSysexEvent(view: DataView, pointer: number) {
  const { length, value } = readVariableLengthQuantity(view, pointer)
  const event: SysexEvent = {
    type: EventType.Sysex,
    data: new ArrayBuffer(2)
  }
  return {
    event,
    byteLength: length + value
  }
}

function parseMetaEvent(view: DataView, pointer: number) {
  let byteLength = 0

  const metaType = view.getUint8(pointer)
  pointer++
  byteLength++

  const { length, value } = readVariableLengthQuantity(view, pointer)
  pointer += length
  byteLength += length

  const buffer = new DataView(view.buffer, view.byteOffset + pointer, value)
  pointer += value
  byteLength += value

  const event: MetaEvent = {
    type: EventType.Meta,
    metaType,
    dataView: buffer
  }

  return {
    event,
    byteLength
  }
}

function parseMidiEvent(view: DataView, pointer: number, statusByte: number) {
  let byteLength = 0

  // Extract the upper nibble for event type
  const eventType = (statusByte >> 4) & 0x0f
  // Extract the lower nibble for MIDI channel
  const channel = statusByte & 0x0f

  const hasTwoDataBytes =
    eventType !== MidiEventType.ProgramChange &&
    eventType !== MidiEventType.ChannelPressure

  const data = view.getUint8(pointer)
  byteLength++
  pointer++

  let otherData: number | undefined

  if (hasTwoDataBytes) {
    otherData = view.getUint8(pointer)
    byteLength++
  }

  const event: MidiEvent = {
    type: EventType.Midi,
    eventType: eventType as MidiEventType,
    channel: channel,
    data: data,
    otherData
  }

  return {
    event,
    byteLength
  }
}

function parseEvent(
  view: DataView,
  byteOffset: number,
  lastStatusByte: number
) {
  let pointer = byteOffset
  let byteLength = 0

  const { value: deltaTime, length } = readVariableLengthQuantity(view, pointer)
  byteLength += length
  pointer += length

  let statusByte = view.getUint8(pointer)

  if (statusByte < 0x80) {
    if (lastStatusByte === 0) {
      throw new Error('Running status used without a previous status byte')
    }
    statusByte = lastStatusByte
  } else {
    pointer++
    byteLength++
  }

  let event
  let eventParsingResult

  if (
    statusByte === MidiEventType.SystemExclusiveMessage ||
    statusByte === MidiEventType.SystemExclusiveMessageEnd
  ) {
    eventParsingResult = parseSysexEvent(view, pointer)
  } else if (
    (statusByte & 0xf0) >= MidiEventType.NoteOff << 4 &&
    (statusByte & 0xf0) <= MidiEventType.PitchModulationWheel << 4
  ) {
    eventParsingResult = parseMidiEvent(view, pointer, statusByte)
  } else if (statusByte === MidiEventType.Meta) {
    eventParsingResult = parseMetaEvent(view, pointer)
  } else {
    throw new Error(`Unknown event type ${statusByte.toString(16)}`)
  }

  event = eventParsingResult.event
  byteLength += eventParsingResult.byteLength

  return {
    event,
    deltaTime,
    statusByte,
    byteLength
  }
}

function* events(
  view: DataView
): Generator<{ currentTime: number; event: Event }> {
  let currentTime = 0
  let byteOffset = 0
  let lastStatusByte = 0
  while (byteOffset < view.byteLength) {
    const { event, byteLength, statusByte, deltaTime } = parseEvent(
      view,
      byteOffset,
      lastStatusByte
    )
    lastStatusByte = statusByte
    byteOffset += byteLength
    currentTime += deltaTime
    yield { event: event as any, currentTime }
  }
}

function* mergedEvents(tracks: Chunk[]): EventGenerator {
  const generators = tracks.map(track => {
    const generator = events(track.view);
    return { generator, next: generator.next().value || null };
  });

  let currentTime = 0;

  while (true) {
    let earliestTime = Infinity;
    let earliestIndex = -1;

    for (let i = 0; i < generators.length; i++) {
      const { next } = generators[i];

      if (next && next.currentTime < earliestTime) {
        earliestTime = next.currentTime;
        earliestIndex = i;
      }
    }

    if (earliestIndex === -1) break;

    const currentTrack = generators[earliestIndex];

    yield {
      event: currentTrack.next.event,
      deltaTime: earliestTime - currentTime,
    };

    currentTrack.next = currentTrack.generator.next().value || null;
    currentTime = earliestTime;
  }
}

function parseHeader(chunk: Chunk): Header {
  if (chunk.type !== ChunkType.MThd) {
    throw new Error('Invalid chunk type for header')
  }
  const view = chunk.view

  const format = view.getUint16(0, false)
  const numberOfTracks = view.getUint16(2, false)
  const division = view.getUint16(4, false)

  if (division & 0x8000) {
    throw new Error('SMPTE division format not supported')
  }

  return {
    format,
    numberOfTracks,
    division
  }
}

function* chunks(buffer: ArrayBuffer): Generator<Chunk> {
  const view = new DataView(buffer)
  let pointer = 0

  while (pointer < view.byteLength) {
    const type = String.fromCharCode(...new Uint8Array(buffer, pointer, 4))
    pointer += 4
    const length = view.getUint32(pointer, false)
    pointer += 4
    yield {
      type: type as ChunkType,
      view: new DataView(view.buffer, pointer, length)
    }
    pointer += length
  }
}

export class Midi {
  public header: Header
  private tracks: Chunk[]

  constructor(buffer: ArrayBuffer) {
    const chunkGenerator = chunks(buffer)

    this.header = parseHeader(chunkGenerator.next().value)

    this.tracks = Array.from(chunkGenerator).filter(
      (track) => track.type === ChunkType.MTrk
    )
  }

  public generator(): EventGenerator {
    return mergedEvents(this.tracks)
  }
}
