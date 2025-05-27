import { playMidi } from '../player/playTrack'
import { getState, setCurrentPlayback } from './appState'
import {
  startProgressUpdates,
  stopProgressUpdates,
  updateProgressBar
} from './progressBar'

export function initPlaybackController(): void {
  document
    .getElementById('display')!
    .addEventListener('touchend', togglePlayback)
  document.getElementById('display')!.addEventListener('click', togglePlayback)
}

async function togglePlayback() {
  const state = getState()

  if (state.currentPlayback?.isPlaying()) {
    state.currentPlayback.pause()
    stopProgressUpdates()
    return
  } else if (state.currentPlayback?.isPaused()) {
    await state.currentPlayback.resume()
    startProgressUpdates()
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

  const playback = playMidi(
    state.audioContext,
    state.gainNode,
    state.analyserNode,
    state.selectedMidi,
    state.selectedWaveform
  )

  setCurrentPlayback(playback)
  updateProgressBar()
  startProgressUpdates()
}
