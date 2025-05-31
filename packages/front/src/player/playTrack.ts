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
  getCurrentPosition: () => number // 0-1 ratio
  getTotalDuration: () => number // seconds
  isPlaying(): boolean
  seekTo: (position: number) => void // 0-1 ratio
}

function pausePlayback(ctx: PlaybackContext): void {
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
  // Ensure AudioContext is running before resuming playback
  if (ctx.audioContext.state === 'suspended') {
    try {
      await ctx.audioContext.resume()
    } catch (error) {
      console.error('Failed to resume AudioContext:', error)
      return
    }
  }

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

  processEvent(ctx, event)
  return true
}

function scheduleEvents(ctx: PlaybackContext): void {
  const maxTime = ctx.audioContext.currentTime + SCHEDULE_AHEAD_TIME

  while (ctx.scheduledTime < maxTime) {
    const hasMoreEvents = processNextEvent(ctx)
    if (!hasMoreEvents) {
      break
    }
  }
}

function startAudioPlayer(ctx: PlaybackContext): void {
  scheduleEvents(ctx)

  if (ctx.animationFrameId) {
    window.cancelAnimationFrame(ctx.animationFrameId)
    ctx.animationFrameId = undefined
  }

  ctx.animationFrameId = requestAnimationFrame(() => {
    startAudioPlayer(ctx)
  })
}

export function playMidi(
  audioContext: AudioContext,
  gainNode: GainNode,
  analyserNode: AnalyserNode,
  midi: MidiParser
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
    tickDuration: calculateTickDuration(DEFAULT_TEMPO, division),
    scheduledTime: audioContext.currentTime,
    channels: new Map(),
    eventIterator,
    startTime: 0
  }

  startAudioPlayer(ctx)
  let isPlaying = true

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
    ctx.scheduledTime = ctx.audioContext.currentTime
    ctx.startTime = ctx.audioContext.currentTime - actualPosition

    if (isPlaying) {
      startAudioPlayer(ctx)
    }
  }

  return {
    isPlaying: () => isPlaying,
    pause: () => {
      isPlaying = false
      pausePlayback(ctx)
    },
    resume: async () => {
      isPlaying = true
      await resumePlayback(ctx)
    },
    getCurrentPosition: () => {
      if (totalDuration === 0) return 0
      const elapsed = ctx.audioContext.currentTime - ctx.startTime
      return Math.min(elapsed / totalDuration, 1)
    },
    getTotalDuration: () => totalDuration,
    seekTo
  }
}
