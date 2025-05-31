import type { MidiParser } from './parser/midiParser'
import { playMidi, type PlaybackControl } from './player/playTrack'
import {
  startProgressUpdates,
  stopProgressUpdates,
  updateProgressBar
} from './ui/progressBar'

type AppState = {
  playing: boolean
  selectedMidi: MidiParser
  selectedWaveform: OscillatorType
  currentPlayback: PlaybackControl | null
  audioContext: AudioContext
  gainNode: GainNode
  analyserNode: AnalyserNode
  percussion: boolean
}

let state: AppState

export function initAppState(
  defaultMidi: MidiParser,
  audioContext: AudioContext,
  gainNode: GainNode,
  analyserNode: AnalyserNode
): void {
  state = {
    selectedMidi: defaultMidi,
    selectedWaveform: 'sine',
    currentPlayback: null,
    audioContext,
    gainNode,
    analyserNode,
    percussion: true,
    playing: false
  }
}

export function getState(): AppState {
  return state
}

export function setSelectedMidi(midi: MidiParser): void {
  setPlayback(false)
  state.selectedMidi = midi
  state.currentPlayback = null
}

export function setSelectedWaveform(waveform: OscillatorType): void {
  state.selectedWaveform = waveform

  if (state.currentPlayback) {
    state.currentPlayback.setWaveform(waveform)
  }
}

export function getSelectedWaveform() {
  return state.selectedWaveform
}

export function setCurrentPlayback(playback: PlaybackControl | null): void {
  state.currentPlayback = playback
}

export function setPercussion(enabled: boolean): void {
  const state = getState()
  state.currentPlayback?.setPercussion(enabled)
  state.percussion = enabled
}
export function getPercussion(): boolean {
  return getState().percussion
}

export function togglePlayback() {
  const state = getState()
  const next = !state.playing

  setPlayback(next)
}

export async function setPlayback(enable: boolean) {
  const state = getState()
  state.playing = enable

  if (!enable) {
    state.currentPlayback?.pause()
    stopProgressUpdates()
    return
  }

  if (state.audioContext.state === 'suspended') {
    try {
      await state.audioContext.resume()
    } catch (error) {
      console.error('Failed to resume AudioContext:', error)
      return
    }
  }

  if (state.currentPlayback) {
    await state.currentPlayback?.resume()
  } else {
    const playback = playMidi(
      state.audioContext,
      state.gainNode,
      state.analyserNode,
      state.selectedMidi,
      state.selectedWaveform
    )
    setCurrentPlayback(playback)
  }

  updateProgressBar()
  startProgressUpdates()
}
