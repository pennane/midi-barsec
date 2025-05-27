import { MidiReader } from '../models'
import { MidiParser } from '../parser/midiParser'
import { processEvent, PlaybackState, PlaybackContext } from './eventProcessors'
import {
  DEFAULT_TEMPO,
  SCHEDULE_AHEAD_TIME,
  calculateTickDuration
} from '../lib'

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

function processNextEvent(
  context: PlaybackContext,
  state: PlaybackState
): boolean {
  const next = state.eventIterator.next()

  if (next.done) {
    return false
  }

  const { event, deltaTime } = next.value
  const eventTime = deltaTime * state.tickDuration
  state.scheduledTime += eventTime

  processEvent(event, context, state)
  return true
}

function scheduleEvents(context: PlaybackContext, state: PlaybackState): void {
  const maxTime = context.audioContext.currentTime + SCHEDULE_AHEAD_TIME

  while (state.isPlaying && state.scheduledTime < maxTime) {
    const hasMoreEvents = processNextEvent(context, state)
    if (!hasMoreEvents) {
      state.isPlaying = false
      break
    }
  }
}

function startAudioPlayer(
  context: PlaybackContext,
  state: PlaybackState
): void {
  if (!state.isPlaying) {
    return
  }

  scheduleEvents(context, state)

  state.animationFrameId = requestAnimationFrame(() => {
    startAudioPlayer(context, state)
  })
}

export async function playMidi(
  audioContext: AudioContext,
  gainNode: GainNode,
  analyserNode: AnalyserNode,
  midi: MidiParser,
  waveform: OscillatorType
): Promise<void> {
  const division = midi.header.division

  if (typeof division !== 'number') {
    throw new Error(
      'Unsupported division type. Only numerical division is supported.'
    )
  }

  const context: PlaybackContext = {
    audioContext,
    gainNode,
    analyserNode,
    division,
    waveform
  }

  const state = createPlaybackState(midi.reader)
  state.tickDuration = calculateTickDuration(DEFAULT_TEMPO, context.division)
  state.scheduledTime = context.audioContext.currentTime

  startAudioPlayer(context, state)
}
