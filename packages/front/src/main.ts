import defaultMidiFile from './chaozfantasy.mid?arraybuffer'
import './style.css'

import { MidiParser } from './parser/midiParser'
import { playMidi, type PlaybackControl } from './player/playTrack'
import { initFileSelector } from './ui/fileSelector'
import { initPlaybackController } from './ui/playbackController'
import {
  initProgressBar,
  setTotalDuration,
  startProgressUpdates,
  stopProgressUpdates,
  updateProgressBar
} from './ui/progressBar'
import { initializeVisualizer } from './ui/visualizer2/visualizer'
import { initVolumeControl } from './ui/volumeControl'

// Global state variables
let selectedMidi: MidiParser
let currentPlayback: PlaybackControl | null = null
let audioContext: AudioContext
let gainNode: GainNode
let analyserNode: AnalyserNode

// Initialize audio context and nodes
audioContext = new (window.AudioContext ||
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).webkitAudioContext)()

const volumeControlGain = audioContext.createGain()
volumeControlGain.gain.value = 0.5
volumeControlGain.connect(audioContext.destination)

const masterGain = audioContext.createGain()
masterGain.gain.value = 0.05 // Reduce overall volume slightly

const compressor = audioContext.createDynamicsCompressor()
compressor.threshold.setValueAtTime(-10, audioContext.currentTime)
compressor.knee.setValueAtTime(30, audioContext.currentTime)
compressor.ratio.setValueAtTime(12, audioContext.currentTime)
compressor.attack.setValueAtTime(0.003, audioContext.currentTime)
compressor.release.setValueAtTime(0.25, audioContext.currentTime)

masterGain.connect(compressor)
compressor.connect(volumeControlGain)

const analyser = audioContext.createAnalyser()
analyser.connect(masterGain)

// Set global references
gainNode = masterGain
analyserNode = analyser

// Initialize with default MIDI
selectedMidi = new MidiParser(defaultMidiFile)

// State management functions
export function getState() {
  return {
    selectedMidi,
    currentPlayback,
    audioContext,
    gainNode,
    analyserNode
  }
}

export async function setSelectedMidi(midi: MidiParser) {
  await setPlayback(false)
  selectedMidi = midi
  currentPlayback = null
}

export function setCurrentPlayback(playback: PlaybackControl | null): void {
  currentPlayback = playback
}

export async function togglePlayback() {
  const isPlaying = currentPlayback?.isPlaying()
  const next = !isPlaying

  await setPlayback(next)
}

export async function setPlayback(enable: boolean) {
  if (!enable) {
    currentPlayback?.pause()
    stopProgressUpdates()
    return
  }

  if (currentPlayback) {
    await currentPlayback?.resume()
  } else {
    const playback = playMidi(
      audioContext,
      gainNode,
      analyserNode,
      selectedMidi
    )
    setCurrentPlayback(playback)
  }

  updateProgressBar()
  startProgressUpdates()
}

// Initialize everything
initProgressBar()
initVolumeControl(volumeControlGain)
initFileSelector()
initPlaybackController()
setTotalDuration(selectedMidi.duration())

initializeVisualizer(document.getElementById('display')!, analyser)
