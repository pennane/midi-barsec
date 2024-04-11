import { describe, it } from 'node:test'
import assert from 'node:assert'

import { TrackParser } from '../src/parser/TrackParser'
import {
  ChunkType,
  EventType,
  MetaEvent,
  MidiEvent,
  MidiEventType,
  SysexEvent
} from '../src/models'

describe('TrackParser', () => {
  it('correctly parses a variable-length quantity', () => {
    const buffer = Buffer.from([0x1f])
    const chunk = { buffer, type: ChunkType.MTrk }
    const parser = new TrackParser(chunk)

    const result = parser.eatVariableLengthQuantity()

    assert.equal(result, 0x1f)
  })

  it('correctly parses a MIDI event', () => {
    const buffer = Buffer.from([0x00, 0x90, 0x3c, 0x7f])
    const chunk = { buffer, type: ChunkType.MTrk }
    const parser = new TrackParser(chunk)

    parser.parse()

    assert.equal(parser.events.length, 1)
    const midiEvent = parser.events[0].event as MidiEvent
    assert.equal(midiEvent.type, EventType.Midi)
    assert.equal(midiEvent.eventType, MidiEventType.NoteOn)
    assert.equal(midiEvent.channel, 0)
    assert.equal(midiEvent.data, 60)
    assert.equal(midiEvent.otherData, 127)
  })

  it('correctly parses a SysEx event', () => {
    const buffer = Buffer.from([0x00, 0xf0, 0x03, 0x41, 0x42, 0xf7]) // Delta-time, Start of SysEx, Length, Data bytes, End of SysEx
    const chunk = { buffer, type: ChunkType.MTrk }
    const parser = new TrackParser(chunk)

    parser.parse()

    assert.equal(parser.events.length, 1)
    const sysexEvent = parser.events[0].event as SysexEvent
    assert.equal(sysexEvent.type, EventType.Sysex)
    assert.deepEqual(sysexEvent.data, Buffer.from([0xf0, 0x41, 0x42, 0xf7]))
  })

  it('correctly parses a Meta event', () => {
    const buffer = Buffer.from([0x00, 0xff, 0x2f, 0x00])
    const chunk = { buffer, type: ChunkType.MTrk }
    const parser = new TrackParser(chunk)

    parser.parse()

    assert.equal(parser.events.length, 1)
    const metaEvent = parser.events[0].event as MetaEvent
    assert.equal(metaEvent.type, EventType.Meta)
    assert.equal(metaEvent.metaType, 0x2f)
    assert.deepEqual(metaEvent.buffer, Buffer.from([]))
  })

  it('throws an error for unknown event type', () => {
    const buffer = Buffer.from([0x00, 0xab])
    const chunk = { buffer, type: ChunkType.MTrk }
    const parser = new TrackParser(chunk)

    assert.throws(() => {
      parser.parse()
    }, /Unknown event type/)
  })

  it('correctly parses multiple events in sequence', () => {
    const buffer = Buffer.from([
      0x00, 0x90, 0x3c, 0x7f, 0x00, 0x80, 0x3c, 0x00, 0x00, 0xff, 0x2f, 0x00
    ])
    const chunk = { buffer, type: ChunkType.MTrk }
    const parser = new TrackParser(chunk)

    parser.parse()

    assert.equal(parser.events.length, 3)
    assert.equal(parser.events[0].event.type, EventType.Midi)
    assert.equal(parser.events[1].event.type, EventType.Midi)
    assert.equal(parser.events[2].event.type, EventType.Meta)
  })
})
