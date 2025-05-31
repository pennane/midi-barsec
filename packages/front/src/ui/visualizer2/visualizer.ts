import { ceilPowerOfTwo } from '../../lib'

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')!

let target: HTMLElement
let analyser: AnalyserNode
let bufferLength: number
let domainData: Uint8Array<ArrayBuffer>
let animationFrameId: number
let width: number
let height: number

const updateSize = () => {
  width = Math.round(target.offsetWidth)
  height = Math.round(target.offsetHeight)
  analyser.fftSize = ceilPowerOfTwo(width) * 2
  bufferLength = analyser.frequencyBinCount
  domainData = new Uint8Array(bufferLength)
  canvas.width = width
  canvas.height = height
}

export const initializeVisualizer = (
  element: HTMLElement,
  node: AnalyserNode
) => {
  cancelAnimationFrame(animationFrameId!)
  target = element
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
  ctx.lineWidth = 3
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
