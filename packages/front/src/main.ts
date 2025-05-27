import './style.css'
import defaultMidiFile from './megalovania.mid?arraybuffer'

import { MidiParser } from './parser/midiParser'
import { visualize } from './ui/visualizer'
import { initAppState } from './ui/appState'
import { initProgressBar, setTotalDuration } from './ui/progressBar'
import { initWaveformSelector } from './ui/waveformSelector'
import { initFileSelector } from './ui/fileSelector'
import { initPlaybackController } from './ui/playbackController'

const audioCtx = new (window.AudioContext ||
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).webkitAudioContext)()

const gainNode = audioCtx.createGain()
gainNode.gain.value = 0.01
gainNode.connect(audioCtx.destination)

const analyser = audioCtx.createAnalyser()
analyser.connect(gainNode)
analyser.fftSize = 2048

const DEFAULT_MIDI = new MidiParser(defaultMidiFile)
initAppState(DEFAULT_MIDI, audioCtx, gainNode, analyser)
initProgressBar()
initWaveformSelector()
initFileSelector()
initPlaybackController()
setTotalDuration(DEFAULT_MIDI.duration())
visualize(document.getElementById('display')!, analyser)
