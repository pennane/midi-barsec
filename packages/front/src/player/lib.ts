import { DEFAULT_TEMPO, calculateTickDuration } from '../lib'
import { MidiParser } from '../parser/midiParser'
import { PlaybackContext, PlayerState } from './models'

export function calculatePosition(
  audioContext: AudioContext,
  state: PlayerState
): number {
  if (!state.playbackContext || state.totalDuration === 0) return 0
  const elapsed = audioContext.currentTime - state.playbackContext.startTime
  return Math.min(elapsed / state.totalDuration, 1)
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
    currentMidi: midi,
    playbackContext: null,
    totalDuration: midi.duration(),
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

export function resumePlayback(
  state: PlayerState,
  audioContext: AudioContext,
  gainNode: GainNode
): PlayerState {
  if (!state.currentMidi) return state

  let context = state.playbackContext
  if (!context) {
    context = createPlaybackContext(state.currentMidi, audioContext, gainNode)
  } else {
    const now = audioContext.currentTime
    const elapsedTime = state.pausedPosition * state.totalDuration
    context.scheduledTime = now
    context.startTime = now - elapsedTime

    if (state.pausedPosition > 0) {
      const targetTime = state.pausedPosition * state.totalDuration
      const { reader } = state.currentMidi.createSeekReader(targetTime)
      context.eventIterator = reader[Symbol.iterator]()
    }
  }

  return { ...state, isPlaying: true, playbackContext: context }
}

export function seekTo(state: PlayerState, position: number): PlayerState {
  if (!state.currentMidi || !state.playbackContext) return state

  const targetTime = position * state.totalDuration
  const { reader, actualPosition } =
    state.currentMidi.createSeekReader(targetTime)

  const updatedContext = {
    ...state.playbackContext,
    eventIterator: reader[Symbol.iterator](),
    scheduledTime: state.playbackContext.audioContext.currentTime,
    startTime: state.playbackContext.audioContext.currentTime - actualPosition
  }

  return {
    ...state,
    playbackContext: updatedContext,
    pausedPosition: actualPosition / state.totalDuration
  }
}
