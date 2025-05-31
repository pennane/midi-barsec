import type { MidiParser } from './parser/midiParser'
import { playMidi, type PlaybackControl } from './player/playTrack'
import {
  startProgressUpdates,
  stopProgressUpdates,
  updateProgressBar
} from './ui/progressBar'

type AppState = {
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
    percussion: true
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
  const state = getState().currentPlayback?.isPlaying()
  const next = !state

  setPlayback(next)
}

export async function setPlayback(enable: boolean) {
  const state = getState()

  if (!enable) {
    state.currentPlayback?.pause()
    stopProgressUpdates()
    return
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
