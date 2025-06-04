import { MidiParser, Util } from 'parser'
import {
  DEFAULT_TEMPO,
  MidiPlayer,
  MidiPlayerStrategies,
  processEvent
} from 'player'
import { PlaybackContext } from 'player/'

function encodeWAV(audioBuffer: AudioBuffer): ArrayBuffer {
  const numberOfChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const length = audioBuffer.length
  const bytesPerSample = 2 // 16-bit
  const dataSize = length * numberOfChannels * bytesPerSample
  const bufferSize = 44 + dataSize

  const buffer = new ArrayBuffer(bufferSize)
  const view = new DataView(buffer)

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, bufferSize - 8, true) // file size
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // format chunk size
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true) // byte rate
  view.setUint16(32, numberOfChannels * bytesPerSample, true) // block align
  view.setUint16(34, bytesPerSample * 8, true) // bits per sample
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  // Convert audio data to 16-bit PCM
  let offset = 44
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(
        -1,
        Math.min(1, audioBuffer.getChannelData(channel)[i])
      )
      const intSample = Math.round(sample * 0x7fff)
      view.setInt16(offset, intSample, true)
      offset += 2
    }
  }

  return buffer
}

function createOfflinePlaybackContext(
  midi: MidiParser,
  offlineContext: OfflineAudioContext,
  gainNode: GainNode,
  strategies: MidiPlayerStrategies
): PlaybackContext {
  const division = midi.header.division
  if (typeof division !== 'number') {
    throw new Error(
      'Unsupported division type. Only numerical division is supported.'
    )
  }

  return {
    strategies,
    audioContext: offlineContext,
    gainNode,
    division,
    tickDuration: Util.calculateTickDuration(DEFAULT_TEMPO, division),
    scheduledTime: 0,
    channels: new Map(),
    eventIterator: midi.reader()[Symbol.iterator](),
    startTime: 0,
    emit: () => {
      // no-op for offline rendering
    }
  }
}

async function renderMidiToBuffer(
  midi: MidiParser,
  strategies: MidiPlayerStrategies,
  sampleRate: number = 44100
): Promise<AudioBuffer> {
  const duration = midi.duration()
  const offlineContext = new OfflineAudioContext(
    2,
    Math.ceil(duration * sampleRate),
    sampleRate
  )

  const gainNode = offlineContext.createGain()
  gainNode.connect(offlineContext.destination)

  const context = createOfflinePlaybackContext(
    midi,
    offlineContext,
    gainNode,
    strategies
  )

  while (true) {
    const next = context.eventIterator.next()
    if (next.done) break

    const { event, deltaTime } = next.value
    context.scheduledTime += deltaTime * context.tickDuration
    processEvent(context, event)
  }

  return offlineContext.startRendering()
}

export async function exportWav(player: MidiPlayer) {
  const audioBuffer = await renderMidiToBuffer(
    player.midi(),
    player.currentStrategies(),
    44100
  )

  return encodeWAV(audioBuffer)
}

export function downloadWAV(
  wavBuffer: ArrayBuffer,
  filename: string = 'export.wav'
): void {
  const blob = new Blob([wavBuffer], { type: 'audio/wav' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
