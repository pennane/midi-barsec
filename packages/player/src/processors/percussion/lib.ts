import { PercussionNote } from '../../models'
import { PercussionConfig } from './models'

export const calculateVolume = (
  configVolume: number,
  velocity: number
): number => (velocity / 127) * configVolume

const getDefaultEnvelope = () => ({
  attack: 0.01,
  decay: 0.1,
  sustain: 0.1,
  release: 0.2
})

const applyEnvelope = (
  gain: GainNode,
  volume: number,
  envelope: NonNullable<PercussionConfig['envelope']>,
  scheduledTime: number
): void => {
  gain.gain.setValueAtTime(0, scheduledTime)
  gain.gain.linearRampToValueAtTime(volume, scheduledTime + envelope.attack)
  gain.gain.linearRampToValueAtTime(
    volume * envelope.sustain,
    scheduledTime + envelope.attack + envelope.decay
  )
  gain.gain.linearRampToValueAtTime(
    0,
    scheduledTime + envelope.attack + envelope.decay + envelope.release
  )
}

const createNoiseBuffer = (
  audioContext: AudioContext,
  duration: number
): AudioBuffer => {
  const sampleRate = audioContext.sampleRate
  const bufferLength = sampleRate * duration
  const buffer = audioContext.createBuffer(1, bufferLength, sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferLength; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5
  }

  return buffer
}

const createNoiseSource = (
  audioContext: AudioContext,
  config: PercussionConfig
): AudioBufferSourceNode => {
  const bufferSource = audioContext.createBufferSource()
  bufferSource.buffer = createNoiseBuffer(audioContext, config.duration)
  bufferSource.loop = false
  return bufferSource
}

const createOscillatorSource = (
  audioContext: AudioContext,
  config: PercussionConfig,
  scheduledTime: number
): OscillatorNode => {
  const oscillator = audioContext.createOscillator()
  const envelope = config.envelope || getDefaultEnvelope()

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(config.frequency || 200, scheduledTime)

  if (config.frequency) {
    oscillator.frequency.exponentialRampToValueAtTime(
      config.frequency * 0.3,
      scheduledTime + envelope.attack + envelope.decay
    )
  }

  return oscillator
}

const createHybridSource = (
  audioContext: AudioContext,
  config: PercussionConfig,
  scheduledTime: number
): { source: OscillatorNode; mixGain: GainNode } => {
  const envelope = config.envelope || getDefaultEnvelope()
  const mixGain = audioContext.createGain()

  const oscillator = audioContext.createOscillator()
  const oscGain = audioContext.createGain()
  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(config.frequency || 200, scheduledTime)

  if (config.frequency) {
    oscillator.frequency.exponentialRampToValueAtTime(
      config.frequency * 0.3,
      scheduledTime + envelope.attack + envelope.decay
    )
  }

  oscillator.connect(oscGain)
  oscGain.connect(mixGain)

  const bufferSource = createNoiseSource(audioContext, config)
  const noiseGain = audioContext.createGain()
  bufferSource.connect(noiseGain)
  noiseGain.connect(mixGain)

  oscGain.gain.setValueAtTime(0.6, scheduledTime)
  noiseGain.gain.setValueAtTime(0.4, scheduledTime)

  oscillator.start(scheduledTime)
  oscillator.stop(scheduledTime + config.duration)
  bufferSource.start(scheduledTime)
  bufferSource.stop(scheduledTime + config.duration)

  return { source: oscillator, mixGain }
}

const createAndConnectFilter = (
  audioContext: AudioContext,
  config: PercussionConfig,
  source: AudioNode,
  destination: AudioNode,
  scheduledTime: number
): BiquadFilterNode | undefined => {
  if (!config.filterType || !config.filterFrequency) {
    source.connect(destination)
    return undefined
  }

  const filter = audioContext.createBiquadFilter()
  filter.type = config.filterType
  filter.frequency.setValueAtTime(config.filterFrequency, scheduledTime)

  if (config.filterQ) {
    filter.Q.setValueAtTime(config.filterQ, scheduledTime)
  }

  source.connect(filter)
  filter.connect(destination)
  return filter
}

export const createPercussionSound = (
  config: PercussionConfig,
  audioContext: AudioContext,
  volume: number,
  scheduledTime: number
): PercussionNote => {
  const gain = audioContext.createGain()
  const envelope = config.envelope || getDefaultEnvelope()

  let source: OscillatorNode | AudioBufferSourceNode
  let filter: BiquadFilterNode | undefined

  switch (config.type) {
    case 'noise':
      source = createNoiseSource(audioContext, config)
      filter = createAndConnectFilter(
        audioContext,
        config,
        source,
        gain,
        scheduledTime
      )
      break

    case 'hybrid': {
      const { source: hybridSource, mixGain } = createHybridSource(
        audioContext,
        config,
        scheduledTime
      )
      source = hybridSource
      mixGain.connect(gain)
      break
    }

    case 'oscillator':
    default:
      source = createOscillatorSource(audioContext, config, scheduledTime)
      filter = createAndConnectFilter(
        audioContext,
        config,
        source,
        gain,
        scheduledTime
      )
      break
  }

  applyEnvelope(gain, volume, envelope, scheduledTime)

  return {
    source,
    gain,
    filter,
    startTime: scheduledTime,
    duration: config.duration
  }
}

export const startPercussionSource = (
  source: OscillatorNode | AudioBufferSourceNode,
  config: PercussionConfig,
  scheduledTime: number
): void => {
  if (config.type === 'hybrid') {
    return
  }

  source.start(scheduledTime)
  source.stop(scheduledTime + config.duration)
}
