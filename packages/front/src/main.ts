import defaultMidiFile from './megalovania.mid?arraybuffer'
import './style.css'

import { initAppState } from './appState'
import { MidiParser } from './parser/midiParser'
import { initFileSelector } from './ui/fileSelector'
import { initPlaybackController } from './ui/playbackController'
import { initProgressBar, setTotalDuration } from './ui/progressBar'
import { visualize } from './ui/visualizer'
import { initWaveformSelector } from './ui/waveformSelector'
import { initVolumeControl } from './ui/volumeControl'

const audioCtx = new (window.AudioContext ||
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).webkitAudioContext)()

// Create volume control gain node (for user volume control)
const volumeGainNode = audioCtx.createGain()
volumeGainNode.gain.value = 0.5 // 50% default volume
volumeGainNode.connect(audioCtx.destination)

// Create main gain node (for audio processing)
const gainNode = audioCtx.createGain()
gainNode.gain.value = 0.01
gainNode.connect(volumeGainNode) // Connect to volume control instead of destination

const analyser = audioCtx.createAnalyser()
analyser.connect(gainNode) // Analyser still connects to main gain node (unaffected by volume)
analyser.fftSize = 2048

const DEFAULT_MIDI = new MidiParser(defaultMidiFile)
initAppState(DEFAULT_MIDI, audioCtx, gainNode, analyser)
initProgressBar()
initWaveformSelector()
initVolumeControl(volumeGainNode)
initFileSelector()
initPlaybackController()
setTotalDuration(DEFAULT_MIDI.duration())
visualize(document.getElementById('display')!, analyser)
