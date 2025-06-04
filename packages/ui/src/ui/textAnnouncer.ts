const target = document.getElementById('announcer')!

export function announce(message: string) {
  const formatted = message.trim()
  if (!formatted) return
  const toast = document.createElement('div')
  toast.textContent = message
  toast.className = 'toast'
  target.appendChild(toast)

  // Trigger animation by forcing reflow before adding animation class
  void toast.offsetWidth
  toast.classList.add('toast-show')

  toast.addEventListener('animationend', () => {
    toast.remove()
  })
}
