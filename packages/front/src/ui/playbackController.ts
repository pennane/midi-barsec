import { MidiPlayer } from '../player/models'

async function toggle(player: MidiPlayer): Promise<void> {
  if (player.isPlaying()) {
    player.pause()
  } else {
    await player.play()
  }
}

export function initPlaybackController(player: MidiPlayer): void {
  document
    .getElementById('display')!
    .addEventListener('click', () => toggle(player))
  document.addEventListener('keydown', async (event) => {
    if (event.code !== 'Space' || event.repeat) return
    event.preventDefault()
    await toggle(player)
  })
  document.addEventListener('visibilitychange', async () => {
    if (document.hidden) {
      player.pause()
    }
  })
}
