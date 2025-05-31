import defaultMidiFile from './chaozfantasy.mid?arraybuffer'
import './style.css'

import { MidiParser } from './parser/midiParser'
import { createPlayer } from './player/midiPlayer'
import { initFileSelector } from './ui/fileSelector'
import { initPlaybackController } from './ui/playbackController'
import { initProgressBar } from './ui/progressBar'
import { initializeVisualizer } from './ui/visualizer2/visualizer'
import { initVolumeControl } from './ui/volumeControl'

const defaultMidi = new MidiParser(defaultMidiFile)

const audioContext = new (window.AudioContext ||
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).webkitAudioContext)()

const volumeGain = audioContext.createGain()
volumeGain.gain.value = 0.5
volumeGain.connect(audioContext.destination)

const splitterGain = audioContext.createGain()
splitterGain.gain.value = 1.0

const masterGain = audioContext.createGain()
masterGain.gain.value = 0.05

const compressor = audioContext.createDynamicsCompressor()
compressor.threshold.setValueAtTime(-10, audioContext.currentTime)
compressor.knee.setValueAtTime(30, audioContext.currentTime)
compressor.ratio.setValueAtTime(12, audioContext.currentTime)
compressor.attack.setValueAtTime(0.003, audioContext.currentTime)
compressor.release.setValueAtTime(0.25, audioContext.currentTime)

const analyserNode = audioContext.createAnalyser()

splitterGain.connect(analyserNode)
splitterGain.connect(masterGain)
masterGain.connect(compressor)
compressor.connect(volumeGain)

const player = createPlayer(audioContext, splitterGain)

async function initialize() {
  await player.load(defaultMidi)
  initProgressBar(player)
  initFileSelector(player)
  initPlaybackController(player)
  initVolumeControl(volumeGain)
  initializeVisualizer(analyserNode)
}

void initialize()
