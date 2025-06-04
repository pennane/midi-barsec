import { readEvent } from './eventReader'
import { calculateMidiDuration } from './lib'
import {
  EventType,
  MidiChunk,
  MidiChunkType,
  MidiFileHeader,
  MidiReader,
  MidiTrackEvent
} from './spec'

/**
 * k-way merge
 */
function* mergeTracksToSingleReader(tracks: MidiChunk[]): MidiReader {
  const readers = tracks.map((track) => readEvents(track.view))
  const nexts = readers.map((gen) => gen.next().value ?? null)

  let time = 0
  while (true) {
    let earliestIndex = -1
    let earliestTime = Infinity

    for (let i = 0; i < nexts.length; i++) {
      const next = nexts[i]
      if (next && next.currentTime < earliestTime) {
        earliestTime = next.currentTime
        earliestIndex = i
      }
    }

    if (earliestIndex === -1) break

    const next = nexts[earliestIndex]!
    yield { event: next.event, deltaTime: earliestTime - time }

    nexts[earliestIndex] = readers[earliestIndex].next().value || null
    time = earliestTime
  }
}

function readHeader(chunk: MidiChunk): MidiFileHeader {
  if (chunk.type !== MidiChunkType.MThd) {
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

function* readChunks(buffer: ArrayBuffer): Generator<MidiChunk> {
  const view = new DataView(buffer)
  let pointer = 0

  while (pointer + 8 <= view.byteLength) {
    const typeBytes = new Uint8Array(buffer, pointer, 4)
    const type = String.fromCharCode(...typeBytes)
    pointer += 4

    const length = view.getUint32(pointer, false)
    pointer += 4

    if (pointer + length > view.byteLength) {
      console.warn(
        `Chunk '${type}' claims length ${length}, but only ${
          view.byteLength - pointer
        } bytes remain`
      )
      break
    }

    yield {
      type: type as MidiChunkType,
      view: new DataView(buffer, pointer, length)
    }

    pointer += length
  }

  if (pointer < view.byteLength) {
    console.warn(`Unparsed trailing bytes: ${view.byteLength - pointer}`)
  }
}

function* readEvents(
  view: DataView
): Generator<{ currentTime: number; event: MidiTrackEvent }> {
  let currentTime = 0
  let offset = 0
  let lastStatusByte = 0

  while (offset < view.byteLength) {
    const { event, byteLength, deltaTime, statusByte } = readEvent(
      view,
      offset,
      lastStatusByte
    )
    offset += byteLength

    if (event.type === EventType.Sysex) continue

    currentTime += deltaTime
    lastStatusByte = statusByte
    yield { currentTime, event }
  }
}

class MidiParser {
  public readonly header: MidiFileHeader
  private tracks: MidiChunk[]
  private _duration: number | null = null

  constructor(buffer: ArrayBuffer) {
    const chunkReader = readChunks(buffer)
    this.header = readHeader(chunkReader.next().value)
    this.tracks = []
    for (const chunk of chunkReader) {
      if (chunk.type === MidiChunkType.MTrk) {
        this.tracks.push(chunk)
      }
    }
  }

  public reader(): MidiReader {
    return mergeTracksToSingleReader(this.tracks)
  }

  public duration(): number {
    if (this._duration) return this._duration

    if (typeof this.header.division !== 'number') {
      throw new Error('Unsupported division type for duration calculation')
    }

    this._duration = calculateMidiDuration(this.reader(), this.header.division)

    return this._duration
  }
}

export const createMidiParser = (buffer: ArrayBuffer) => {
  return new MidiParser(buffer)
}
