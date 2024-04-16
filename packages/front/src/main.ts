import './style.css'
import { Midi } from './models'
import defaultMidi from './out.json'
import { playMidi } from './player'
import { ensureOnce } from './util'
import { visualize } from './visualizer'
import { MidiParser } from './parser/MidiParser'
import { Buffer } from 'buffer'

const DEFAULT_MIDI = defaultMidi as Midi

let selectedMidi: Midi = DEFAULT_MIDI

const audioCtx = new (window.AudioContext ||
  (window as any).webkitAudioContext)()

const gainNode = audioCtx.createGain()
gainNode.gain.value = 0.05
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
    const midi = new MidiParser(Buffer.from(arrayBuffer)).parse()
    selectedMidi = midi
  } catch (e) {
    alert(e)
  }
}

document.getElementById('display')!.addEventListener('touchstart', play)
document.getElementById('display')!.addEventListener('click', play)
document.getElementById('input')!.addEventListener('change', selectFile)

visualize(document.getElementById('display')!, analyser)
