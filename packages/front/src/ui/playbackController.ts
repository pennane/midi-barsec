import { setPlayback, togglePlayback } from '../appState'

export function initPlaybackController(): void {
  document.getElementById('display')!.addEventListener('click', togglePlayback)
  document.addEventListener('keydown', (event) => {
    if (event.code !== 'Space' || event.repeat) return
    event.preventDefault()
    togglePlayback()
  })
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      setPlayback(false)
    }
  })
}
