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

const volumeGainNode = audioCtx.createGain()
volumeGainNode.gain.value = 0.5
volumeGainNode.connect(audioCtx.destination)

const gainNode = audioCtx.createGain()
gainNode.gain.value = 0.01
gainNode.connect(volumeGainNode)

const analyser = audioCtx.createAnalyser()
analyser.connect(gainNode)
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
