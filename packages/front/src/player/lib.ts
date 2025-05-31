import { DEFAULT_TEMPO, calculateTickDuration, withStartingTime } from '../lib'
import { MidiParser } from '../parser'

import { PlaybackContext, PlayerState } from './models'

export function calculatePosition(
  audioContext: AudioContext,
  state: PlayerState
): number {
  if (!state.playbackContext || state.midi?.duration() === 0) return 0
  const elapsed = audioContext.currentTime - state.playbackContext.startTime
  return Math.min(elapsed / state.midi.duration(), 1)
}

export function createPlaybackContext(
  midi: MidiParser,
  audioContext: AudioContext,
  gainNode: GainNode
): PlaybackContext {
  const division = midi.header.division
  if (typeof division !== 'number') {
    throw new Error(
      'Unsupported division type. Only numerical division is supported.'
    )
  }

  const now = audioContext.currentTime
  return {
    audioContext,
    gainNode,
    division,
    tickDuration: calculateTickDuration(DEFAULT_TEMPO, division),
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
  gainNode: GainNode
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
        gainNode
      ),
      isPlaying: true
    }
  }

  const now = audioContext.currentTime
  const elapsedTime = state.pausedPosition * state.midi.duration()
  state.playbackContext.scheduledTime = now
  state.playbackContext.startTime = now - elapsedTime

  return { ...state, isPlaying: true }
}

export function seekTo(state: PlayerState, position: number): PlayerState {
  if (!state.midi || !state.playbackContext) return state

  const targetTime = position * state.midi.duration()
  const reader = withStartingTime(state.midi, targetTime)

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
