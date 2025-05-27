import { getState } from './appState'

let progressFill: HTMLElement
let currentTimeDisplay: HTMLElement
let totalTimeDisplay: HTMLElement
let progressBar: HTMLElement
let updateInterval: number | null = null

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function updateDisplay(): void {
  const state = getState()
  if (!state.currentPlayback) return

  const position = state.currentPlayback.getCurrentPosition()
  const totalDuration = state.currentPlayback.getTotalDuration()
  const currentTime = position * totalDuration

  progressFill.style.width = `${position * 100}%`
  currentTimeDisplay.textContent = formatTime(currentTime)
  totalTimeDisplay.textContent = formatTime(totalDuration)
}

export function initProgressBar(): void {
  progressFill = document.getElementById('progress-fill')!
  currentTimeDisplay = document.getElementById('current-time')!
  totalTimeDisplay = document.getElementById('total-time')!
  progressBar = document.getElementById('progress-bar')!

  progressBar.addEventListener('click', (event) => {
    const state = getState()
    if (!state.currentPlayback) return

    const rect = progressBar.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const position = clickX / rect.width

    state.currentPlayback.seekTo(Math.max(0, Math.min(1, position)))
    updateDisplay()
  })
}

export function updateProgressBar(): void {
  updateDisplay()
}

export function startProgressUpdates(): void {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
  updateInterval = setInterval(updateDisplay, 100)
}

export function stopProgressUpdates(): void {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
  }
}

export function resetProgressBar(): void {
  progressFill.style.width = '0%'
  currentTimeDisplay.textContent = '0:00'
  totalTimeDisplay.textContent = '0:00'
}

export function setTotalDuration(duration: number): void {
  totalTimeDisplay.textContent = formatTime(duration)
}
