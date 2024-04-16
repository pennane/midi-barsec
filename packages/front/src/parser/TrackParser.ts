import { Buffer } from 'buffer'
import {
  MTrkEvent,
  Byte,
  Chunk,
  EventType,
  MetaEvent,
  MidiEvent,
  MidiEventType,
  SysexEvent,
  Track
} from '../models'

export class TrackParser {
  pointer: number
  events: MTrkEvent[]
  lastStatusByte: Byte | null

  constructor(public chunk: Chunk) {
    this.pointer = 0
    this.events = []
    this.lastStatusByte = null
  }

  parse(): Track {
    while (this.pointer < this.chunk.buffer.length) {
      this.eatEvent()
    }

    return {
      events: this.events
    }
  }

  eatEvent() {
    const deltaTime = this.eatVariableLengthQuantity()

    let statusByte = this.peek(1)[0]

    if (statusByte < 0x80) {
      if (!this.lastStatusByte) {
        throw new Error('Running status used without a previous status byte')
      }
      statusByte = this.lastStatusByte
    } else {
      this.eat(1)
      this.lastStatusByte = statusByte
    }

    if (
      (statusByte & 0xf0) >= MidiEventType.NoteOff << 4 &&
      (statusByte & 0xf0) <= MidiEventType.PitchModulationWheel << 4
    ) {
      this.events.push({ deltaTime, event: this.eatMidiEvent(statusByte) })
    }
  }

  eatMidiEvent(statusByte: number): MidiEvent {
    // Extract the upper nibble for event type
    const eventType = (statusByte >> 4) & 0x0f
    // Extract the lower nibble for MIDI channel
    const channel = statusByte & 0x0f

    const hasTwoDataBytes =
      eventType !== MidiEventType.ProgramChange &&
      eventType !== MidiEventType.ChannelPressure

    const data = this.eat(1)[0]
    let otherData: Byte | undefined = undefined

    if (hasTwoDataBytes) {
      otherData = this.eat(1)[0]
    }

    return {
      type: EventType.Midi,
      eventType: eventType as MidiEventType,
      channel: channel,
      data: data,
      otherData
    }
  }

  eatSysexEvent(statusByte: number): SysexEvent {
    const statusBuffer = Buffer.from([statusByte])

    const length = this.eatVariableLengthQuantity()

    if (this.pointer + length > this.chunk.buffer.length) {
      throw new Error('SysEx event length extends beyond chunk data.')
    }

    const sysexData = this.eat(length)

    const data = Buffer.concat([statusBuffer, sysexData])

    if (data[data.length - 1] !== MidiEventType.SystemExclusiveMessageEnd) {
      throw new Error(
        "SysEx event does not end with 'End of Exclusive' status byte."
      )
    }

    return {
      type: EventType.Sysex,
      data
    }
  }

  eatMetaEvent(): MetaEvent {
    const metaType = this.eat(1)[0]
    const length = this.eatVariableLengthQuantity()
    const buffer = this.eat(length)

    return {
      type: EventType.Meta,
      metaType,
      buffer
    }
  }

  eatVariableLengthQuantity() {
    let value = 0
    while (this.pointer < this.chunk.buffer.length) {
      const byte = this.eat(1)[0]
      value = (value << 7) | (byte & 0x7f)
      if ((byte & 0x80) === 0) {
        break
      }
    }
    return value
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
