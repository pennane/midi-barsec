import { MidiPlayer } from '../player'

async function toggle(player: MidiPlayer): Promise<void> {
  if (player.isPlaying()) {
    player.pause()
  } else {
    void player.play()
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
  let pausedByVisibilityChange = false
  document.addEventListener('visibilitychange', async () => {
    if (document.hidden && player.isPlaying()) {
      player.pause()
      pausedByVisibilityChange = true
    } else if (!document.hidden && pausedByVisibilityChange) {
      pausedByVisibilityChange = false
      void player.play()
    }
  })
}
