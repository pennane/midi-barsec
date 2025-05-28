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

  // Set initial display
  updateVolumeDisplay(volumeSlider.value, volumeDisplay)

  // Handle volume changes
  volumeSlider.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement
    const volume = parseInt(target.value) / 100 // Convert 0-100 to 0-1

    volumeGainNode.gain.setValueAtTime(
      volume,
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
