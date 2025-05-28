const canvas = document.createElement('canvas')
const canvasCtx = canvas.getContext('2d')!

const SIZE = 200
canvas.width = SIZE
canvas.height = SIZE

export function visualize(target: HTMLElement, analyser: AnalyserNode) {
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  analyser.getByteTimeDomainData(dataArray)

  target.appendChild(canvas)

  draw(analyser, dataArray)
}

function draw(analyser: AnalyserNode, dataArray: Uint8Array<ArrayBuffer>) {
  const bufferLength = analyser.frequencyBinCount

  analyser.getByteTimeDomainData(dataArray)

  canvasCtx.fillStyle = 'rgb(0 0 0)'
  canvasCtx.fillRect(0, 0, SIZE, SIZE)

  canvasCtx.lineWidth = 3
  canvasCtx.strokeStyle = '#006aff'

  canvasCtx.beginPath()

  const sliceWidth = SIZE / bufferLength
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

  requestAnimationFrame(() => draw(analyser, dataArray))
}
