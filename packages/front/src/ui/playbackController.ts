import { getState, setCurrentPlayback } from '../appState'
import { playMidi } from '../player/playTrack'
import {
  startProgressUpdates,
  stopProgressUpdates,
  updateProgressBar
} from './progressBar'

export function initPlaybackController(): void {
  document.getElementById('display')!.addEventListener('click', togglePlayback)
  document.addEventListener('keydown', (event) => {
    if (event.code !== 'Space' || event.repeat) return
    event.preventDefault()
    togglePlayback()
  })
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      setPlayback(false)
    }
  })
}

function togglePlayback() {
  const state = getState()
  const next = !state.playing

  setPlayback(next)
}

async function setPlayback(enable: boolean) {
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
