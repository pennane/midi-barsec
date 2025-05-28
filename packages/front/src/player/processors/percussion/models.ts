export type PercussionNote = {
  gain: GainNode
  oscillator: OscillatorNode | AudioBufferSourceNode
  sustained: boolean
}

export type PercussionConfig = {
  type: 'oscillator' | 'noise' | 'hybrid'
  frequency?: number
  duration: number
  volume: number
  filterType?: BiquadFilterType
  filterFrequency?: number
  filterQ?: number
  envelope?: {
    attack: number
    decay: number
    sustain: number
    release: number
  }
}
