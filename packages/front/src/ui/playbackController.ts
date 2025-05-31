import { setPlayback, togglePlayback } from '../main'

export function initPlaybackController(): void {
  document.getElementById('display')!.addEventListener('click', togglePlayback)
  document.addEventListener('keydown', async (event) => {
    if (event.code !== 'Space' || event.repeat) return
    event.preventDefault()
    await togglePlayback()
  })
  document.addEventListener('visibilitychange', async () => {
    if (document.hidden) {
      await setPlayback(false)
    }
  })
}
