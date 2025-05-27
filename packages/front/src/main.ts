import './style.css'
import defaultMidiFile from './megalovania.mid?arraybuffer'

import { MidiParser } from './parser/midiParser'
import { playMidi, PlaybackControl } from './player/playTrack'
import { visualize } from './visualizer/visualizer'

const DEFAULT_MIDI_ARRAY_BUFFER: ArrayBuffer = defaultMidiFile
const DEFAULT_MIDI = new MidiParser(DEFAULT_MIDI_ARRAY_BUFFER)

let selectedMidi: MidiParser = DEFAULT_MIDI
let selectedWaveform: OscillatorType = 'sawtooth'
let currentPlayback: PlaybackControl | null = null

const audioCtx = new (window.AudioContext ||
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).webkitAudioContext)()

const gainNode = audioCtx.createGain()
gainNode.gain.value = 0.01
gainNode.connect(audioCtx.destination)

const analyser = audioCtx.createAnalyser()
analyser.connect(gainNode)
analyser.fftSize = 2048

async function togglePlayback() {
  if (currentPlayback?.isPlaying()) {
    currentPlayback.pause()
    return
  } else if (currentPlayback?.isPaused()) {
    currentPlayback.resume()
    return
  }

  currentPlayback = playMidi(
    audioCtx,
    gainNode,
    analyser,
    selectedMidi,
    selectedWaveform
  )
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

    // Pause current playback if any and reset to allow new track
    if (currentPlayback?.isPlaying()) {
      currentPlayback.pause()
    }
    currentPlayback = null // Reset to allow new track to start fresh

    selectedMidi = midi
  } catch (e) {
    alert(e)
  }
}

document.getElementById('display')!.addEventListener('touchend', togglePlayback)
document.getElementById('display')!.addEventListener('click', togglePlayback)
document.getElementById('input')!.addEventListener('change', selectFile)

document
  .getElementById('waveform')!
  .addEventListener('change', function (this: HTMLInputElement) {
    selectedWaveform = this.value as OscillatorType

    // Update the waveform for currently playing music
    if (currentPlayback) {
      currentPlayback.setWaveform(selectedWaveform)
    }
  })

visualize(document.getElementById('display')!, analyser)
