import defaultMidiFile from './chaozfantasy.mid?arraybuffer'
import './style.css'

import { initAppState } from './appState'
import { MidiParser } from './parser/midiParser'
import { initFileSelector } from './ui/fileSelector'
import { initPlaybackController } from './ui/playbackController'
import { initProgressBar, setTotalDuration } from './ui/progressBar'
import { initializeVisualizer } from './ui/visualizer2/visualizer'
import { initVolumeControl } from './ui/volumeControl'
import { initWaveformSelector } from './ui/waveformSelector'

const audioContext = new (window.AudioContext ||
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

const DEFAULT_MIDI = new MidiParser(defaultMidiFile)
initAppState(DEFAULT_MIDI, audioContext, masterGain, analyser)
initProgressBar()
initWaveformSelector()
initVolumeControl(volumeControlGain)
initFileSelector()
initPlaybackController()
setTotalDuration(DEFAULT_MIDI.duration())

initializeVisualizer(document.getElementById('display')!, analyser)
