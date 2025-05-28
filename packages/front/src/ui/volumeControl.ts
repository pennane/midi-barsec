import { getPercussion, setPercussion } from '../appState'

let volumeGainNode: GainNode

export function initVolumeControl(gainNode: GainNode): void {
  volumeGainNode = gainNode

  const volumeSlider = document.getElementById(
    'volume-slider'
  )! as HTMLInputElement

  volumeSlider.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement
    const volume = parseInt(target.value) / 100

    volumeGainNode.gain.setValueAtTime(
      volume * 3,
      volumeGainNode.context.currentTime
    )
  })

  const percussion = document.getElementById(
    'percussion-checkbox'
  )! as HTMLInputElement
  percussion.checked = getPercussion()

  percussion.addEventListener('click', () => {
    setPercussion((percussion as any).checked)
  })
}
