import { createMidiParser } from 'parser'
import { MidiPlayer } from 'player'

let midiPlayer: MidiPlayer
export function initFileSelector(player: MidiPlayer): void {
  midiPlayer = player
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
    return
  }
  const arrayBuffer = await file?.arrayBuffer()
  if (!arrayBuffer) {
    alert('coulda not make buffer :(')
    return
  }

  try {
    const midi = createMidiParser(arrayBuffer)
    await midiPlayer.load(midi)
  } catch (e) {
    alert(e)
  }
}
