import {
  DEFAULT_TEMPO,
  SCHEDULE_AHEAD_TIME,
  calculateTickDuration
} from '../lib'
import { MidiReader } from '../models'
import { MidiParser } from '../parser/midiParser'
import { processEvent } from './eventProcessors'
import { PlaybackContext, PlaybackState } from './models'

export type PlaybackControl = {
  pause: () => void
  resume: () => Promise<void>
  isPlaying: () => boolean
  isPaused: () => boolean
  setWaveform: (waveform: OscillatorType) => void
  setPercussion: (enabled: boolean) => void
  getCurrentPosition: () => number // 0-1 ratio
  getTotalDuration: () => number // seconds
  seekTo: (position: number) => void // 0-1 ratio
}

function createPlaybackState(
  reader: MidiReader,
  totalDuration: number
): PlaybackState {
  const eventIterator = reader[Symbol.iterator]()
  return {
    tickDuration: calculateTickDuration(DEFAULT_TEMPO, 1),
    scheduledTime: 0,
    channels: new Map(),
    isPlaying: true,
    eventIterator,
    currentTimeSeconds: 0,
    totalDurationSeconds: totalDuration,
    startTime: 0
  }
}

function pausePlayback(state: PlaybackState, ctx: PlaybackContext): void {
  state.isPlaying = false

  for (const channel of state.channels.values()) {
    for (const note of channel.notes.values()) {
      try {
        note.oscillator.stop(ctx.audioContext.currentTime)
      } catch {}
    }
  }
  state.channels.clear()

  if (state.animationFrameId) {
    window.cancelAnimationFrame(state.animationFrameId)
    state.animationFrameId = undefined
  }
}

async function resumePlayback(
  state: PlaybackState,
  ctx: PlaybackContext
): Promise<void> {
  if (state.isPlaying) return

  // Ensure AudioContext is running before resuming playback
  if (ctx.audioContext.state === 'suspended') {
    try {
      await ctx.audioContext.resume()
    } catch (error) {
      console.error('Failed to resume AudioContext:', error)
      return
    }
  }

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
  state.currentTimeSeconds += eventTime

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
  for (const channel of state.channels.values())
    for (const note of channel.notes.values()) {
      try {
        note.oscillator.type = newWaveform
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
    waveform,
    percussion: false
  }

  const totalDuration = midi.duration()
  const state = createPlaybackState(midi.reader(), totalDuration)
  state.tickDuration = calculateTickDuration(DEFAULT_TEMPO, ctx.division)
  state.scheduledTime = ctx.audioContext.currentTime
  state.startTime = ctx.audioContext.currentTime

  startAudioPlayer(ctx, state)

  function seekTo(position: number): void {
    const targetTime = position * totalDuration
    const { reader, actualPosition } = midi.createSeekReader(targetTime)

    for (const channel of state.channels.values()) {
      for (const note of channel.notes.values()) {
        try {
          note.oscillator.stop(ctx.audioContext.currentTime)
        } catch {}
      }
    }
    state.channels.clear()

    state.eventIterator = reader[Symbol.iterator]()
    state.currentTimeSeconds = actualPosition
    state.scheduledTime = ctx.audioContext.currentTime
    state.startTime = ctx.audioContext.currentTime - actualPosition

    if (state.isPlaying) {
      startAudioPlayer(ctx, state)
    }
  }

  return {
    pause: () => pausePlayback(state, ctx),
    resume: () => resumePlayback(state, ctx),
    isPlaying: () => state.isPlaying,
    isPaused: () => !state.isPlaying,
    setWaveform: (newWaveform: OscillatorType) =>
      setWaveform(state, ctx, newWaveform),
    getCurrentPosition: () => {
      if (state.totalDurationSeconds === 0) return 0
      const elapsed = ctx.audioContext.currentTime - state.startTime
      return Math.min(elapsed / state.totalDurationSeconds, 1)
    },
    getTotalDuration: () => state.totalDurationSeconds,
    seekTo,
    setPercussion: (enabled) => (ctx.percussion = enabled)
  }
}
