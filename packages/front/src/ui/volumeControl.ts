export function initVolumeControl(volumeGain: GainNode): void {
  const volumeSlider = document.getElementById(
    'volume-slider'
  )! as HTMLInputElement

  volumeSlider.value = (volumeGain.gain.value * 100).toString()

  volumeSlider.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement
    const volume = parseInt(target.value) / 100

    volumeGain.gain.value = volume * 3
  })
}
