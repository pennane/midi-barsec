let volumeGainNode: GainNode

export function initVolumeControl(gainNode: GainNode): void {
  volumeGainNode = gainNode

  const volumeSlider = document.getElementById(
    'volume-slider'
  ) as HTMLInputElement
  const volumeDisplay = document.getElementById(
    'volume-display'
  ) as HTMLSpanElement

  if (!volumeSlider || !volumeDisplay) {
    console.error('Volume control elements not found')
    return
  }

  updateVolumeDisplay(volumeSlider.value, volumeDisplay)

  volumeSlider.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement
    const volume = parseInt(target.value) / 100

    volumeGainNode.gain.setValueAtTime(
      volume * 3,
      volumeGainNode.context.currentTime
    )
    updateVolumeDisplay(target.value, volumeDisplay)
  })
}

function updateVolumeDisplay(
  value: string,
  displayElement: HTMLSpanElement
): void {
  displayElement.textContent = `${value}%`
}
