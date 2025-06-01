const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')!
const target = document.getElementById('display')!

let analyser: AnalyserNode
let bufferLength: number
let domainData: Uint8Array<ArrayBuffer>
let animationFrameId: number
let width: number
let height: number

const updateSize = () => {
  const size = 200
  width = size
  height = size
  analyser.fftSize = 4096 // ceilPowerOfTwo(width) * 2
  bufferLength = analyser.frequencyBinCount
  domainData = new Uint8Array(bufferLength)
  canvas.width = width
  canvas.height = height
}

export const initVisualizer = (node: AnalyserNode) => {
  cancelAnimationFrame(animationFrameId!)
  analyser = node
  updateSize()
  target.appendChild(canvas)
  window.addEventListener('resize', updateSize)
  loop()
}

const loop = () => {
  draw()
  animationFrameId = requestAnimationFrame(loop)
}

const draw = () => {
  analyser.getByteTimeDomainData(domainData)

  ctx.clearRect(0, 0, width, height)
  ctx.beginPath()
  ctx.lineWidth = 2
  ctx.strokeStyle = '#006aff'

  const centerY = height / 2
  const scale = centerY

  const sliceWidth = width / bufferLength
  let x = 0

  for (let i = 0; i < bufferLength; i++) {
    const y = centerY + ((domainData[i] - 128) / 128) * scale
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
    x += sliceWidth
  }

  ctx.stroke()
}
