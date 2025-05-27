import './style.css'
import defaultMidiFile from './megalovania.mid?arraybuffer'

import { MidiParser } from './parser/midiParser'
import { playMidi, PlaybackControl } from './player/playTrack'
import { visualize } from './visualizer/visualizer'

enum OscillatorTypes {
  SAWTOOTH = 'sawtooth',
  SINE = 'sine',
  SQUARE = 'square',
  TRIANGLE = 'triangle'
}

const OSCILLATOR_DISPLAY_NAMES: Record<OscillatorTypes, string> = {
  [OscillatorTypes.SAWTOOTH]: 'Sawtooth',
  [OscillatorTypes.SINE]: 'Sine',
  [OscillatorTypes.SQUARE]: 'Square',
  [OscillatorTypes.TRIANGLE]: 'Triangle'
}

const DEFAULT_MIDI_ARRAY_BUFFER: ArrayBuffer = defaultMidiFile
const DEFAULT_MIDI = new MidiParser(DEFAULT_MIDI_ARRAY_BUFFER)

let selectedMidi: MidiParser = DEFAULT_MIDI
let selectedWaveform: OscillatorType = OscillatorTypes.SAWTOOTH
let currentPlayback: PlaybackControl | null = null
let progressUpdateInterval: number | null = null

const audioCtx = new (window.AudioContext ||
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).webkitAudioContext)()

const gainNode = audioCtx.createGain()
gainNode.gain.value = 0.01
gainNode.connect(audioCtx.destination)

const analyser = audioCtx.createAnalyser()
analyser.connect(gainNode)
analyser.fftSize = 2048

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function updateProgressBar() {
  if (!currentPlayback) return

  const position = currentPlayback.getCurrentPosition()
  const totalDuration = currentPlayback.getTotalDuration()
  const currentTime = position * totalDuration

  const progressFill = document.getElementById('progress-fill')!
  const currentTimeDisplay = document.getElementById('current-time')!
  const totalTimeDisplay = document.getElementById('total-time')!

  progressFill.style.width = `${position * 100}%`
  currentTimeDisplay.textContent = formatTime(currentTime)
  totalTimeDisplay.textContent = formatTime(totalDuration)
}

function startProgressUpdates() {
  if (progressUpdateInterval) {
    clearInterval(progressUpdateInterval)
  }
  progressUpdateInterval = setInterval(updateProgressBar, 100)
}

function stopProgressUpdates() {
  if (progressUpdateInterval) {
    clearInterval(progressUpdateInterval)
    progressUpdateInterval = null
  }
}

async function togglePlayback() {
  if (currentPlayback?.isPlaying()) {
    currentPlayback.pause()
    stopProgressUpdates()
    return
  } else if (currentPlayback?.isPaused()) {
    currentPlayback.resume()
    startProgressUpdates()
    return
  }

  currentPlayback = playMidi(
    audioCtx,
    gainNode,
    analyser,
    selectedMidi,
    selectedWaveform
  )

  // Initialize progress bar
  updateProgressBar()
  startProgressUpdates()
}

async function selectFile(event: Event) {
  const fileList = ((event.target as HTMLInputElement)?.files ||
    null) as FileList | null

  if (!fileList) {
    alert('abort da mission')
    return
  }
  const file = fileList?.item(0)
  if (!file) {
    alert('pls select midi file')
    return
  }
  const arrayBuffer = await file?.arrayBuffer()
  if (!arrayBuffer) {
    alert('coulda not make buffer :(')
    return
  }

  try {
    const midi = new MidiParser(arrayBuffer)

    if (currentPlayback?.isPlaying()) {
      currentPlayback.pause()
    }
    stopProgressUpdates()
    currentPlayback = null

    selectedMidi = midi

    // Reset progress bar
    const progressFill = document.getElementById('progress-fill')!
    const currentTimeDisplay = document.getElementById('current-time')!
    const totalTimeDisplay = document.getElementById('total-time')!

    progressFill.style.width = '0%'
    currentTimeDisplay.textContent = '0:00'
    totalTimeDisplay.textContent = formatTime(midi.duration())
  } catch (e) {
    alert(e)
  }
}

document.getElementById('display')!.addEventListener('touchend', togglePlayback)
document.getElementById('display')!.addEventListener('click', togglePlayback)
document.getElementById('input')!.addEventListener('change', selectFile)

// Progress bar seeking
document.getElementById('progress-bar')!.addEventListener('click', (event) => {
  if (!currentPlayback) return

  const progressBar = event.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const position = clickX / rect.width

  currentPlayback.seekTo(Math.max(0, Math.min(1, position)))
  updateProgressBar()
})

document
  .getElementById('waveform')!
  .addEventListener('change', function (this: HTMLInputElement) {
    selectedWaveform = this.value as OscillatorType

    // Update the waveform for currently playing music
    if (currentPlayback) {
      currentPlayback.setWaveform(selectedWaveform)
    }
  })

function populateWaveformSelect() {
  const selectElement = document.getElementById('waveform') as HTMLSelectElement
  selectElement.innerHTML = ''
  Object.values(OscillatorTypes).forEach((type) => {
    const option = document.createElement('option')
    option.value = type
    option.textContent = OSCILLATOR_DISPLAY_NAMES[type]
    option.selected = type === OscillatorTypes.SAWTOOTH
    selectElement.appendChild(option)
  })
}

populateWaveformSelect()

// Initialize progress bar with default MIDI
const totalTimeDisplay = document.getElementById('total-time')!
totalTimeDisplay.textContent = formatTime(DEFAULT_MIDI.duration())

visualize(document.getElementById('display')!, analyser)
