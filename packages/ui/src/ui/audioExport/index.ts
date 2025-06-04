import { MidiPlayer } from 'player'
import { downloadWAV, exportWav } from './lib'

const button = document.getElementById('audio-export-button')! as HTMLElement

async function handleExport(player: MidiPlayer): Promise<void> {
  if (button.getAttribute('disabled')) return
  button.setAttribute('disabled', 'true')

  try {
    const wavBuffer = await exportWav(player)
    downloadWAV(wavBuffer, 'export.wav')
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    alert(`Export failed: ${errorMessage}`)
  } finally {
    button.removeAttribute('disabled')
  }
}

export const initAudioExport = (player: MidiPlayer) => {
  button.removeAttribute('disabled')
  button.addEventListener('click', () => handleExport(player))
}
