import { MidiParser } from 'parser'
import { SCHEDULE_AHEAD_TIME } from './constants'
import { processEvent } from './eventProcessors'

import { Emitter } from './eventEmitter'
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
  MidiPlayerStrategies,
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

const defaultStrategies: MidiPlayerStrategies = {
  instruments: { type: 'instruments' },
  percussion: { type: 'enabled' },
  controllers: { type: 'enabled' }
}

class Player extends Emitter<MidiPlayerEventMap> implements MidiPlayer {
  private state: PlayerState
  private readonly audioContext: AudioContext
  private readonly gainNode: GainNode
  private schedulingId?: number
  private progressInterval?: number
  private strategies: MidiPlayerStrategies

  constructor(
    audioContext: AudioContext,
    gainNode: GainNode,
    strategies: MidiPlayerStrategies
  ) {
    super()
    this.audioContext = audioContext
    this.gainNode = gainNode
    this.state = createInitialState()
    this.strategies = strategies
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
    this.emit('progressUpdate', this.position())
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

    this.state = startPlayback(
      this.state,
      this.audioContext,
      this.gainNode,
      this.strategies,
      this.emit.bind(this)
    )
    this.schedulingId = requestAnimationFrame(this.scheduleEvents)
    this.progressInterval = setInterval(() => this.emitProgress(), 100)
    this.emitProgress()
  }

  updateStrategies(strategies: Partial<MidiPlayerStrategies>) {
    const prev = this.strategies
    const curr = strategies
    this.strategies = { ...prev, ...curr }

    if (!this.state.playbackContext) return

    this.state.playbackContext.strategies = this.strategies
  }

  currentStrategies() {
    return this.strategies
  }

  position() {
    const position = calculatePosition(this.audioContext, this.state)
    return {
      position,
      duration: this.state.midi?.duration() ?? 0,
      currentTime: position * (this.state.midi?.duration() ?? 0),
      isPlaying: this.state.isPlaying
    }
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
  gainNode: GainNode,
  strategies: Partial<MidiPlayerStrategies> = {}
): MidiPlayer {
  return new Player(audioContext, gainNode, {
    ...defaultStrategies,
    ...strategies
  })
}
