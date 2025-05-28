import { getSelectedWaveform, setSelectedWaveform } from '../appState'

enum OscillatorTypes {
  SAWTOOTH = 'sawtooth',
  SINE = 'sine',
  SQUARE = 'square',
  TRIANGLE = 'triangle'
}

const OSCILLATOR_DISPLAY_NAMES: Record<OscillatorTypes, string> = {
  [OscillatorTypes.SINE]: 'Sine',
  [OscillatorTypes.SAWTOOTH]: 'Sawtooth',
  [OscillatorTypes.SQUARE]: 'Square',
  [OscillatorTypes.TRIANGLE]: 'Triangle'
}

export function initWaveformSelector(): void {
  const selectElement = document.getElementById('waveform') as HTMLSelectElement
  selectElement.innerHTML = ''

  Object.values(OscillatorTypes).forEach((type) => {
    const option = document.createElement('option')
    option.value = type
    option.textContent = OSCILLATOR_DISPLAY_NAMES[type]
    option.selected = type === getSelectedWaveform()
    selectElement.appendChild(option)
  })

  selectElement.addEventListener('change', function (this: HTMLInputElement) {
    setSelectedWaveform(this.value as OscillatorType)
  })
}
