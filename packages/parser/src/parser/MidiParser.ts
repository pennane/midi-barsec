import { Chunk, ChunkType, Header, Midi, Track } from '../models'
import { HeaderParser } from './HeaderParser'
import { TrackParser } from './TrackParser'

export class MidiParser {
  header: Header
  tracks: Track[]
  pointer: number
  chunks: Chunk[]

  constructor(public buffer: Buffer) {
    this.header = null as any
    this.pointer = 0
    this.chunks = []
    this.tracks = []
  }

  parse(): Midi {
    this.eatHeader()
    while (this.pointer < this.buffer.length) {
      this.eatTrack()
    }
    return {
      header: this.header,
      tracks: this.tracks
    }
  }

  eatChunk(): Chunk {
    const type = this.eat(4).toString() as ChunkType

    if (!(type in ChunkType)) throw new Error(`Got unknown chunktype ${type}`)

    const length = this.eat(4).readUInt32BE(0)
    const buffer = this.eat(length)

    return {
      type,
      buffer
    }
  }

  eatHeader() {
    const chunk = this.eatChunk()
    this.header = new HeaderParser(chunk).parse()
  }

  eatTrack() {
    const chunk = this.eatChunk()
    if (chunk.type !== ChunkType.MTrk) {
      return
    }

    const track = new TrackParser(chunk).parse()

    this.tracks.push(track)
  }

  eat(amount: number) {
    const result = this.peek(amount)
    this.advance(amount)
    return result
  }

  peek(amount: number) {
    return this.buffer.slice(this.pointer, this.pointer + amount)
  }

  advance(amount: number) {
    this.pointer += amount
  }
}
