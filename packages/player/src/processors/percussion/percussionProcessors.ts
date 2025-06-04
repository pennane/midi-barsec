import { Spec } from 'parser'
import { EventProcessor } from '../../models'
import { getOrCreateChannel } from '../lib'
import { PERCUSSION_CONFIGS } from './config'

import {
  calculateVolume,
  createPercussionSound,
  startPercussionSource
} from './lib'

export const percussionProcessors = {
  noteOn: (ctx, event) => {
    if (ctx.strategies.percussion.type === 'disabled') return
    const noteNumber = event.data1 as Spec.GeneralMidiInstrument.Percussion
    const config = PERCUSSION_CONFIGS[noteNumber]
    if (!config) return
    const channel = getOrCreateChannel(ctx, event.channel, true)
    const velocity = event.data2 ?? 127

    const volume = calculateVolume(config.volume, velocity)

    const { source, gain } = createPercussionSound(
      config,
      ctx.audioContext,
      volume,
      ctx.scheduledTime
    )

    gain.connect(channel.panner)
    startPercussionSource(source, config, ctx.scheduledTime)
  },

  noteOff: (_ctx, _event) => {
    // no-op, percussion designed as shoot and forget
  }
} as const satisfies Record<string, EventProcessor<Spec.MidiChannelMessage>>
