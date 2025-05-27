import { MidiReader } from '../models'
import { MidiParser } from '../parser/midiParser'
import { processEvent, PlaybackState, PlaybackContext } from './eventProcessors'
import {
  DEFAULT_TEMPO,
  SCHEDULE_AHEAD_TIME,
  calculateTickDuration
} from '../lib'

export type PlaybackControl = {
  pause: () => void
  resume: () => void
  isPlaying: () => boolean
  isPaused: () => boolean
  setWaveform: (waveform: OscillatorType) => void
}

function createPlaybackState(reader: MidiReader): PlaybackState {
  const eventIterator = reader[Symbol.iterator]()
  return {
    tickDuration: calculateTickDuration(DEFAULT_TEMPO, 1),
    scheduledTime: 0,
    activeNotes: new Map(),
    isPlaying: true,
    eventIterator
  }
}

function pausePlayback(state: PlaybackState, ctx: PlaybackContext): void {
  state.isPlaying = false

  for (const oscillator of state.activeNotes.values()) {
    try {
      oscillator.stop(ctx.audioContext.currentTime)
    } catch (e) {}
  }
  state.activeNotes.clear()

  if (state.animationFrameId) {
    cancelAnimationFrame(state.animationFrameId)
    state.animationFrameId = undefined
  }
}

function resumePlayback(state: PlaybackState, ctx: PlaybackContext): void {
  if (state.isPlaying) return

  state.isPlaying = true
  state.scheduledTime = ctx.audioContext.currentTime

  startAudioPlayer(ctx, state)
}

function processNextEvent(ctx: PlaybackContext, state: PlaybackState): boolean {
  const next = state.eventIterator.next()

  if (next.done) {
    return false
  }

  const { event, deltaTime } = next.value
  const eventTime = deltaTime * state.tickDuration
  state.scheduledTime += eventTime

  processEvent(event, ctx, state)
  return true
}

function scheduleEvents(ctx: PlaybackContext, state: PlaybackState): void {
  const maxTime = ctx.audioContext.currentTime + SCHEDULE_AHEAD_TIME

  while (state.isPlaying && state.scheduledTime < maxTime) {
    const hasMoreEvents = processNextEvent(ctx, state)
    if (!hasMoreEvents) {
      state.isPlaying = false
      break
    }
  }
}

function startAudioPlayer(ctx: PlaybackContext, state: PlaybackState): void {
  if (!state.isPlaying) {
    return
  }

  scheduleEvents(ctx, state)

  state.animationFrameId = requestAnimationFrame(() => {
    startAudioPlayer(ctx, state)
  })
}

function setWaveform(
  state: PlaybackState,
  ctx: PlaybackContext,
  newWaveform: OscillatorType
): void {
  ctx.waveform = newWaveform
  for (const oscillator of state.activeNotes.values()) {
    try {
      oscillator.type = newWaveform
    } catch (e) {
      console.warn('Could not update oscillator waveform:', e)
    }
  }
}

export function playMidi(
  audioContext: AudioContext,
  gainNode: GainNode,
  analyserNode: AnalyserNode,
  midi: MidiParser,
  waveform: OscillatorType
): PlaybackControl {
  const division = midi.header.division

  if (typeof division !== 'number') {
    throw new Error(
      'Unsupported division type. Only numerical division is supported.'
    )
  }

  const ctx: PlaybackContext = {
    audioContext,
    gainNode,
    analyserNode,
    division,
    waveform
  }

  const state = createPlaybackState(midi.reader)
  state.tickDuration = calculateTickDuration(DEFAULT_TEMPO, ctx.division)
  state.scheduledTime = ctx.audioContext.currentTime

  startAudioPlayer(ctx, state)

  return {
    pause: () => pausePlayback(state, ctx),
    resume: () => resumePlayback(state, ctx),
    isPlaying: () => state.isPlaying,
    isPaused: () => !state.isPlaying,
    setWaveform: (newWaveform: OscillatorType) =>
      setWaveform(state, ctx, newWaveform)
  }
}
