export function midiNoteToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12)
}
