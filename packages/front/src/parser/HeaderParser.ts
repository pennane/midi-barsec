import { Chunk, Header, ChunkType } from '../models'

export class HeaderParser {
  pointer: number

  constructor(public chunk: Chunk) {
    this.pointer = 0
  }

  eatDivision() {
    const divisionBytes = this.eat(2).readUint16BE(0)

    if (divisionBytes & 0x8000) {
      const smpteFormat = -((divisionBytes >> 8) & 0x7f) // Extract SMPTE format and convert to signed
      const ticksPerFrame = divisionBytes & 0xff // Extract ticks per frame
      return { smpteFormat, ticksPerFrame }
    }

    return divisionBytes
  }

  parse(): Header {
    if (this.chunk.type !== ChunkType.MThd) {
      throw new Error(`Expected ${ChunkType.MThd} got ${this.chunk.type}`)
    }
    const format = this.eat(2).readUint16BE(0)

    const numberOfTracks = this.eat(2).readUInt16BE(0)

    const division = this.eatDivision()
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
