export function ensureOnce(func: () => void) {
  let called = false
  return function () {
    if (called) return
    called = true
    func()
  }
}

export function midiNoteToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12)
}
