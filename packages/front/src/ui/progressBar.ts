import { MidiPlayer, MidiPlayerEventMap } from '../player/midiPlayer'

let progressFill: HTMLElement
let currentTimeDisplay: HTMLElement
let totalDurationDisplay: HTMLElement
let progressBar: HTMLElement

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function updateProgressBar(
  event: CustomEvent<MidiPlayerEventMap['progressUpdate']>
): void {
  const { position, currentTime, duration } = event.detail
  progressFill.style.width = `${position * 100}%`
  currentTimeDisplay.textContent = formatTime(currentTime)
  totalDurationDisplay.textContent = formatTime(duration)
}

export function initProgressBar(player: MidiPlayer): void {
  progressFill = document.getElementById('progress-fill')!
  currentTimeDisplay = document.getElementById('current-time')!
  totalDurationDisplay = document.getElementById('total-time')!
  progressBar = document.getElementById('progress-bar')!

  player.addEventListener('progressUpdate', updateProgressBar)

  progressBar.addEventListener('click', (event) => {
    const rect = progressBar.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const position = Math.max(0, Math.min(1, clickX / rect.width))
    player.seek(position)
  })
}
