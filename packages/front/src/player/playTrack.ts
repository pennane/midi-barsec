import { getState } from '../appState'
import {
  DEFAULT_TEMPO,
  SCHEDULE_AHEAD_TIME,
  calculateTickDuration
} from '../lib'
import { MidiParser } from '../parser/midiParser'
import { processEvent } from './eventProcessors'
import { PlaybackContext } from './models'

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

function pausePlayback(ctx: PlaybackContext): void {
  ctx.isPlaying = false

  for (const channel of ctx.channels.values()) {
    for (const note of channel.notes.values()) {
      try {
        note.oscillator.stop(ctx.audioContext.currentTime)
      } catch {}
    }
  }
  ctx.channels.clear()

  if (ctx.animationFrameId) {
    window.cancelAnimationFrame(ctx.animationFrameId)
    ctx.animationFrameId = undefined
  }
}

async function resumePlayback(ctx: PlaybackContext): Promise<void> {
  if (ctx.isPlaying) return

  // Ensure AudioContext is running before resuming playback
  if (ctx.audioContext.state === 'suspended') {
    try {
      await ctx.audioContext.resume()
    } catch (error) {
      console.error('Failed to resume AudioContext:', error)
      return
    }
  }

  ctx.isPlaying = true
  ctx.scheduledTime = ctx.audioContext.currentTime

  startAudioPlayer(ctx)
}

function processNextEvent(ctx: PlaybackContext): boolean {
  const next = ctx.eventIterator.next()

  if (next.done) {
    return false
  }

  const { event, deltaTime } = next.value
  const eventTime = deltaTime * ctx.tickDuration
  ctx.scheduledTime += eventTime
  ctx.currentTimeSeconds += eventTime

  processEvent(ctx, event)
  return true
}

function scheduleEvents(ctx: PlaybackContext): void {
  const maxTime = ctx.audioContext.currentTime + SCHEDULE_AHEAD_TIME

  while (ctx.isPlaying && ctx.scheduledTime < maxTime) {
    const hasMoreEvents = processNextEvent(ctx)
    if (!hasMoreEvents) {
      ctx.isPlaying = false
      break
    }
  }
}

function startAudioPlayer(ctx: PlaybackContext): void {
  if (!ctx.isPlaying) {
    return
  }

  scheduleEvents(ctx)

  ctx.animationFrameId = requestAnimationFrame(() => {
    startAudioPlayer(ctx)
  })
}

function setWaveform(ctx: PlaybackContext, newWaveform: OscillatorType): void {
  ctx.waveform = newWaveform
  for (const channel of ctx.channels.values())
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

  const totalDuration = midi.duration()
  const eventIterator = midi.reader()[Symbol.iterator]()

  const ctx: PlaybackContext = {
    audioContext,
    gainNode,
    analyserNode,
    division,
    waveform,
    percussion: getState().percussion,
    tickDuration: calculateTickDuration(DEFAULT_TEMPO, division),
    scheduledTime: audioContext.currentTime,
    channels: new Map(),
    isPlaying: true,
    eventIterator,
    currentTimeSeconds: 0,
    totalDurationSeconds: totalDuration,
    startTime: 0
  }

  startAudioPlayer(ctx)

  function seekTo(position: number): void {
    const targetTime = position * totalDuration
    const { reader, actualPosition } = midi.createSeekReader(targetTime)

    for (const channel of ctx.channels.values()) {
      for (const note of channel.notes.values()) {
        try {
          note.oscillator.stop(ctx.audioContext.currentTime)
        } catch {}
      }
    }
    ctx.channels.clear()

    ctx.eventIterator = reader[Symbol.iterator]()
    ctx.currentTimeSeconds = actualPosition
    ctx.scheduledTime = ctx.audioContext.currentTime
    ctx.startTime = ctx.audioContext.currentTime - actualPosition

    if (ctx.isPlaying) {
      startAudioPlayer(ctx)
    }
  }

  return {
    pause: () => pausePlayback(ctx),
    resume: () => resumePlayback(ctx),
    isPlaying: () => ctx.isPlaying,
    isPaused: () => !ctx.isPlaying,
    setWaveform: (newWaveform: OscillatorType) => setWaveform(ctx, newWaveform),
    getCurrentPosition: () => {
      if (ctx.totalDurationSeconds === 0) return 0
      const elapsed = ctx.audioContext.currentTime - ctx.startTime
      return Math.min(elapsed / ctx.totalDurationSeconds, 1)
    },
    getTotalDuration: () => ctx.totalDurationSeconds,
    seekTo,
    setPercussion: (enabled) => (ctx.percussion = enabled)
  }
}
