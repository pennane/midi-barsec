import { Chunk, Header, ChunkType } from '../models'

export class HeaderParser {
  pointer: number

  constructor(public chunk: Chunk) {
    this.pointer = 0
  }

  parse(): Header {
    if (this.chunk.type !== ChunkType.MThd) {
      throw new Error(`Expected ${ChunkType.MThd} got ${this.chunk.type}`)
    }
    const format = this.eat(2).readUint16BE(0)

    const numberOfTracks = this.eat(2).readUInt16BE(0)

    const division = this.eat(2).readUint16BE(0)

    return {
      format,
      numberOfTracks,
      division
    }
  }

  eat(amount: number) {
    const result = this.peek(amount)
    this.advance(amount)
    return result
  }

  peek(amount: number) {
    return this.chunk.buffer.slice(this.pointer, this.pointer + amount)
  }

  advance(amount: number) {
    this.pointer += amount
  }
}
