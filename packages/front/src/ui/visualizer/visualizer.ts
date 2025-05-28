import { defaultVisualizer, visualizers } from './config'
import { Visualizer } from './models'

function createVisualizer(
  target: HTMLElement,
  analyser: AnalyserNode,
  visualizer: Visualizer
) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const SIZE = 200
  canvas.width = SIZE
  canvas.height = SIZE
  target.appendChild(canvas)

  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)

  let running = true
  let currentVisualizer = visualizer
  currentVisualizer.init?.(ctx, SIZE)

  function loop() {
    if (!running) return
    analyser.getByteTimeDomainData(dataArray)
    currentVisualizer.draw(analyser, dataArray)
    requestAnimationFrame(loop)
  }

  loop()

  return {
    stop() {
      running = false
      return this
    },
    start() {
      currentVisualizer?.init?.(ctx, SIZE)
      if (!running) {
        running = true
        loop()
      }
      return this
    },
    switchVisualizer(newVisualizer: Visualizer) {
      currentVisualizer.destroy?.()
      currentVisualizer = newVisualizer
      currentVisualizer.init?.(ctx, SIZE)
      return this
    },
    getCanvas() {
      return canvas
    },
    resize(size: number) {
      canvas.width = size
      canvas.height = size
      currentVisualizer.init?.(ctx, size)
      return this
    },
    clear() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      return this
    }
  }
}

export function initializeVisualizer(
  target: HTMLElement,
  analyser: AnalyserNode
) {
  const viz = createVisualizer(target, analyser, defaultVisualizer).start()

  const selectElement = document.getElementById(
    'visualizer'
  ) as HTMLSelectElement

  selectElement.innerHTML = ''

  for (const name of Object.keys(visualizers)) {
    const option = document.createElement('option')
    option.value = name
    option.textContent = name
    option.selected = name === 'basic'
    selectElement.appendChild(option)
    selectElement.addEventListener('change', function (this: HTMLInputElement) {
      viz
        .switchVisualizer(visualizers[this.value as keyof typeof visualizers])
        .start()
    })
  }
}
