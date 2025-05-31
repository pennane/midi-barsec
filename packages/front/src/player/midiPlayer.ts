import { SCHEDULE_AHEAD_TIME } from '../lib'
import { MidiParser } from '../parser/midiParser'
import { processEvent } from './eventProcessors'

import {
  calculatePosition,
  loadMidi,
  pausePlayback,
  resumePlayback,
  seekTo
} from './lib'
import {
  MidiPlayer,
  MidiPlayerEventType,
  MidiPlayerEventMap,
  PlayerState
} from './models'

function createInitialState(): PlayerState {
  return {
    currentMidi: null,
    playbackContext: null,
    isPlaying: false,
    totalDuration: 0,
    pausedPosition: 0
  }
}

export class Player implements MidiPlayer {
  private state: PlayerState = createInitialState()
  private readonly audioContext: AudioContext
  private readonly gainNode: GainNode
  private readonly eventTarget = new EventTarget()
  private schedulingId?: number
  private progressInterval?: number

  constructor(audioContext: AudioContext, gainNode: GainNode) {
    this.audioContext = audioContext
    this.gainNode = gainNode
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
    this.state.playbackContext.channels.clear()
  }

  private emitProgress() {
    const position = this.position()
    this.emit('progressUpdate', {
      position,
      duration: this.state.totalDuration,
      currentTime: position * this.state.totalDuration,
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
    if (!this.state.currentMidi) {
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

    this.state = resumePlayback(this.state, this.audioContext, this.gainNode)
    this.schedulingId = requestAnimationFrame(this.scheduleEvents)
    this.progressInterval = setInterval(() => this.emitProgress(), 100)
    this.emitProgress()
  }

  position() {
    return calculatePosition(this.audioContext, this.state)
  }

  duration() {
    return this.state.totalDuration
  }

  isPlaying() {
    return this.state.isPlaying
  }

  seek(position: number) {
    if (!this.state.currentMidi || !this.state.playbackContext) return

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
  }
}

export function createPlayer(
  audioContext: AudioContext,
  gainNode: GainNode
): MidiPlayer {
  return new Player(audioContext, gainNode)
}
