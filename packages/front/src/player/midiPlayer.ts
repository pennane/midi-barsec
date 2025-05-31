import { SCHEDULE_AHEAD_TIME } from '../lib'
import { MidiParser } from '../parser'
import { processEvent } from './eventProcessors'

import {
  calculatePosition,
  loadMidi,
  pausePlayback,
  seekTo,
  startPlayback
} from './lib'
import {
  MidiPlayer,
  MidiPlayerEventMap,
  MidiPlayerEventType,
  PlayerState
} from './models'

function createInitialState(): PlayerState {
  return {
    midi: null as unknown as MidiParser,
    playbackContext: null,
    isPlaying: false,
    pausedPosition: 0
  }
}

class Player implements MidiPlayer {
  private state: PlayerState
  private readonly audioContext: AudioContext
  private readonly gainNode: GainNode
  private readonly eventTarget = new EventTarget()
  private schedulingId?: number
  private progressInterval?: number

  constructor(audioContext: AudioContext, gainNode: GainNode) {
    this.audioContext = audioContext
    this.gainNode = gainNode
    this.state = createInitialState()
  }

  addEventListener<T extends MidiPlayerEventType>(
    type: T,
    listener: (event: CustomEvent<MidiPlayerEventMap[T]>) => void
  ) {
    this.eventTarget.addEventListener(type, listener as EventListener)
  }

  removeEventListener(type: string, listener: EventListener) {
    this.eventTarget.removeEventListener(type, listener)
  }

  private emit<T extends MidiPlayerEventType>(
    type: T,
    detail: MidiPlayerEventMap[T]
  ) {
    this.eventTarget.dispatchEvent(new CustomEvent(type, { detail }))
  }

  private scheduleEvents = () => {
    if (!this.state.isPlaying || !this.state.playbackContext) return

    const maxTime = this.audioContext.currentTime + SCHEDULE_AHEAD_TIME
    const context = this.state.playbackContext

    while (context.scheduledTime < maxTime) {
      const next = context.eventIterator.next()
      if (next.done) break
      const { event, deltaTime } = next.value
      context.scheduledTime += deltaTime * context.tickDuration
      processEvent(context, event)
    }

    this.schedulingId = requestAnimationFrame(this.scheduleEvents)
  }

  private stopScheduling() {
    if (this.schedulingId) {
      cancelAnimationFrame(this.schedulingId)
      this.schedulingId = undefined
    }
  }

  private stopAllNotes() {
    if (!this.state.playbackContext) return
    for (const channel of this.state.playbackContext.channels.values()) {
      for (const note of channel.notes.values()) {
        try {
          note.oscillator.stop(this.audioContext.currentTime)
        } catch {}
      }
    }
  }

  private emitProgress() {
    const position = this.position()
    this.emit('progressUpdate', {
      position,
      duration: this.state.midi?.duration() ?? 0,
      currentTime: position * (this.state.midi?.duration() ?? 0),
      isPlaying: this.state.isPlaying
    })
  }

  pause() {
    const currentPosition = calculatePosition(this.audioContext, this.state)
    this.state = pausePlayback(this.state, currentPosition)
    this.stopAllNotes()
    this.stopScheduling()
    clearInterval(this.progressInterval)
    this.emitProgress()
  }

  async play() {
    if (!this.state.midi) {
      console.warn('No MIDI file loaded')
      return
    }

    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume()
      } catch (error) {
        console.error('Failed to resume AudioContext:', error)
        return
      }
    }

    this.state = startPlayback(this.state, this.audioContext, this.gainNode)
    this.schedulingId = requestAnimationFrame(this.scheduleEvents)
    this.progressInterval = setInterval(() => this.emitProgress(), 100)
    this.emitProgress()
  }

  position() {
    return calculatePosition(this.audioContext, this.state)
  }

  duration() {
    return this.state.midi.duration()
  }

  isPlaying() {
    return this.state.isPlaying
  }

  seek(position: number) {
    if (!this.state.midi || !this.state.playbackContext) return

    this.stopAllNotes()
    this.stopScheduling()
    this.state = seekTo(this.state, position)

    if (this.state.isPlaying) {
      this.schedulingId = requestAnimationFrame(this.scheduleEvents)
    }
    this.emitProgress()
  }

  async load(midi: MidiParser) {
    this.pause()
    this.state = loadMidi(this.state, midi)
    this.emitProgress()
    return this
  }
}

export function createPlayer(
  audioContext: AudioContext,
  gainNode: GainNode
): MidiPlayer {
  return new Player(audioContext, gainNode)
}
