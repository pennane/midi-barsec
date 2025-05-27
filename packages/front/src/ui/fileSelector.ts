import { MidiParser } from '../parser/midiParser'
import { setSelectedMidi } from './appState'
import {
  resetProgressBar,
  setTotalDuration,
  stopProgressUpdates
} from './progressBar'

export function initFileSelector(): void {
  document.getElementById('input')!.addEventListener('change', selectFile)
}

async function selectFile(event: Event): Promise<void> {
  const fileList = ((event.target as HTMLInputElement)?.files ||
    null) as FileList | null

  if (!fileList) {
    alert('abort da mission')
    return
  }
  const file = fileList?.item(0)
  if (!file) {
    alert('pls select midi file')
    return
  }
  const arrayBuffer = await file?.arrayBuffer()
  if (!arrayBuffer) {
    alert('coulda not make buffer :(')
    return
  }

  try {
    const midi = new MidiParser(arrayBuffer)
    stopProgressUpdates()
    setSelectedMidi(midi)
    resetProgressBar()
    setTotalDuration(midi.duration())
  } catch (e) {
    alert(e)
  }
}
