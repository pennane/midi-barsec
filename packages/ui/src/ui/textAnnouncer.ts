import { MidiPlayer, MidiPlayerEventMap } from 'player'

const target = document.getElementById('announcer')!

function announce(event: MidiPlayerEventMap['announcement']) {
  const formatted = event.text.trim()
  if (!formatted) return
  const toast = document.createElement('div')
  toast.textContent = formatted
  toast.className = 'toast'
  target.appendChild(toast)

  // Trigger animation by forcing reflow before adding animation class
  void toast.offsetWidth
  toast.classList.add('toast-show')

  toast.addEventListener('animationend', () => {
    toast.remove()
  })
}

export function initTextAnnouncer(player: MidiPlayer): void {
  player.addEventListener('announcement', announce)
}
