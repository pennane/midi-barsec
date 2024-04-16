import './style.css'
import { Midi } from './models'
import midiFile from './out.json'
import { playMidi } from './player'
import { ensureOnce } from './util'

const audioCtx = new (window.AudioContext ||
  (window as any).webkitAudioContext)()

const gainNode = audioCtx.createGain()
gainNode.gain.value = 0.05
gainNode.connect(audioCtx.destination)

const play = ensureOnce(() => {
  playMidi(audioCtx, gainNode, analyser, midiFile as Midi)
})

document.addEventListener('click', play)

document.addEventListener('touchstart', play)

const analyser = audioCtx.createAnalyser()
analyser.connect(gainNode)

analyser.fftSize = 2048
const bufferLength = analyser.frequencyBinCount
const dataArray = new Uint8Array(bufferLength)
analyser.getByteTimeDomainData(dataArray)

const canvas = document.createElement('canvas')
const canvasCtx = canvas.getContext('2d')!

const SIZE = 150
canvas.width = SIZE
canvas.height = SIZE

function draw() {
  analyser.getByteTimeDomainData(dataArray)

  canvasCtx.fillStyle = 'rgb(0 0 0)'
  canvasCtx.fillRect(0, 0, SIZE, SIZE)

  canvasCtx.lineWidth = 2
  canvasCtx.strokeStyle = 'rgb(0 0 255)'

  canvasCtx.beginPath()

  const sliceWidth = (SIZE * 1.0) / bufferLength
  let x = 0

  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0
    const y = (v * SIZE) / 2

    if (i === 0) {
      canvasCtx.moveTo(x, y)
    } else {
      canvasCtx.lineTo(x, y)
    }

    x += sliceWidth
  }

  canvasCtx.lineTo(canvas.width, canvas.height / 2)
  canvasCtx.stroke()

  requestAnimationFrame(draw)
}

document.body.appendChild(canvas)
draw()
