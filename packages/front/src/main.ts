import './style.css'
import defaultMidiFile from './megalovania.mid?arraybuffer'
import { playMidi } from './player'
import { ensureOnce } from './util'
import { visualize } from './visualizer'
import { Midi } from './parser/MidiParser'

const DEFAULT_MIDI_ARRAY_BUFFER: ArrayBuffer = defaultMidiFile
const DEFAULT_MIDI = new Midi(DEFAULT_MIDI_ARRAY_BUFFER)

let selectedMidi: Midi = DEFAULT_MIDI

const audioCtx = new (window.AudioContext ||
  (window as any).webkitAudioContext)()

const gainNode = audioCtx.createGain()
gainNode.gain.value = 0.03
gainNode.connect(audioCtx.destination)

const analyser = audioCtx.createAnalyser()
analyser.connect(gainNode)
analyser.fftSize = 2048

const play = ensureOnce(() => {
  document.getElementById('settings')!.classList.add('hidden')
  playMidi(audioCtx, gainNode, analyser, selectedMidi)
})

async function selectFile(event: any) {
  const fileList = ((event.target as any)?.files || null) as FileList | null
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
    const midi = new Midi(arrayBuffer)
    selectedMidi = midi
  } catch (e) {
    alert(e)
  }
}

document.getElementById('display')!.addEventListener('touchend', play)
document.getElementById('display')!.addEventListener('click', play)
document.getElementById('input')!.addEventListener('change', selectFile)

visualize(document.getElementById('display')!, analyser)
