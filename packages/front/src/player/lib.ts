import { DEFAULT_TEMPO } from '../lib'
import { MidiParser, Util } from '../parser'

import { MidiPlayerStrategies, PlaybackContext, PlayerState } from './models'

export function calculatePosition(
  audioContext: AudioContext,
  state: PlayerState
): number {
  if (!state.playbackContext || state.midi?.duration() === 0) return 0
  const elapsed = audioContext.currentTime - state.playbackContext.startTime
  return Math.min(elapsed / state.midi.duration(), 1)
}

function createPlaybackContext(
  midi: MidiParser,
  audioContext: AudioContext,
  gainNode: GainNode,
  strategies: MidiPlayerStrategies
): PlaybackContext {
  const division = midi.header.division
  if (typeof division !== 'number') {
    throw new Error(
      'Unsupported division type. Only numerical division is supported.'
    )
  }

  const now = audioContext.currentTime
  return {
    strategies,
    audioContext,
    gainNode,
    division,
    tickDuration: Util.calculateTickDuration(DEFAULT_TEMPO, division),
    scheduledTime: now,
    channels: new Map(),
    eventIterator: midi.reader()[Symbol.iterator](),
    startTime: now
  }
}

export function loadMidi(state: PlayerState, midi: MidiParser): PlayerState {
  return {
    ...state,
    midi: midi,
    playbackContext: null,
    pausedPosition: 0,
    isPlaying: false
  }
}

export function pausePlayback(
  state: PlayerState,
  currentPosition: number
): PlayerState {
  return { ...state, isPlaying: false, pausedPosition: currentPosition }
}

export function startPlayback(
  state: PlayerState,
  audioContext: AudioContext,
  gainNode: GainNode,
  strategies: MidiPlayerStrategies
): PlayerState {
  if (!state.midi) {
    return state
  }
  if (!state.playbackContext) {
    return {
      ...state,
      playbackContext: createPlaybackContext(
        state.midi,
        audioContext,
        gainNode,
        strategies
      ),
      isPlaying: true
    }
  }

  const now = audioContext.currentTime
  const elapsedTime = state.pausedPosition * state.midi.duration()

  const updatedContext = state.playbackContext

  updatedContext.strategies = strategies
  updatedContext.scheduledTime = now
  updatedContext.startTime = now - elapsedTime

  return {
    ...state,
    isPlaying: true,
    playbackContext: updatedContext
  }
}

export function seekTo(state: PlayerState, position: number): PlayerState {
  if (!state.midi || !state.playbackContext) return state

  const targetTime = position * state.midi.duration()
  const reader = Util.withStartingTime(state.midi, targetTime)

  const updatedContext = {
    ...state.playbackContext,
    eventIterator: reader[Symbol.iterator](),
    scheduledTime: state.playbackContext.audioContext.currentTime,
    startTime: state.playbackContext.audioContext.currentTime - targetTime
  }

  return {
    ...state,
    playbackContext: updatedContext,
    pausedPosition: position
  }
}
