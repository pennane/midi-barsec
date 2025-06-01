import { Spec, Util } from '../parser'
import { Instrument, Note } from './models'

type EnvelopeConfig = {
  attack?: number
  decay?: number
  release?: number
  initialGain?: number
  sustainLevel?: number
}

type InstrumentConfig = {
  oscillatorType: OscillatorType
  envelope: EnvelopeConfig
  gainMultiplier?: number
}

const createGenericInstrument = (config: InstrumentConfig): Instrument => {
  const {
    oscillatorType,
    envelope: {
      attack = 0,
      decay = 0,
      release = 0,
      initialGain = 0,
      sustainLevel = 1
    },
    gainMultiplier = 1
  } = config

  return {
    playNote(ctx, channel, { noteNumber, velocity }) {
      const baseFrequency = Util.midiNoteToFrequency(noteNumber)
      const gain = ctx.audioContext.createGain()
      const finalVelocity = velocity * gainMultiplier

      gain.gain.setValueAtTime(initialGain * finalVelocity, ctx.scheduledTime)

      if (attack > 0) {
        gain.gain.linearRampToValueAtTime(
          finalVelocity,
          ctx.scheduledTime + attack
        )
      } else {
        gain.gain.setValueAtTime(finalVelocity, ctx.scheduledTime)
      }

      if (decay > 0) {
        gain.gain.exponentialRampToValueAtTime(
          finalVelocity * sustainLevel,
          ctx.scheduledTime + attack + decay
        )
      }

      const oscillator = ctx.audioContext.createOscillator()
      oscillator.type = oscillatorType
      oscillator.frequency.setValueAtTime(
        baseFrequency * Util.pitchBendToMultiplier(channel.pitchBend),
        ctx.scheduledTime
      )

      oscillator.connect(gain)
      gain.connect(channel.panner)
      oscillator.start(ctx.scheduledTime)

      const note: Note = {
        oscillator,
        gain,
        baseFrequency,
        noteNumber,
        baseGain: velocity,
        sustained: channel.sustain
      }
      return note
    },
    stopNote(ctx, _channel, note) {
      if (release > 0) {
        note.gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.scheduledTime + release
        )
        note.oscillator.stop(ctx.scheduledTime + release)
      } else {
        note.oscillator.stop(ctx.scheduledTime)
      }
    }
  }
}

const silent = createGenericInstrument({
  oscillatorType: 'triangle',
  envelope: {},
  gainMultiplier: 0
})

export const instruments = {
  basic: {
    default: () =>
      createGenericInstrument({
        oscillatorType: 'sine',
        envelope: {}
      }),
    sine: () =>
      createGenericInstrument({
        oscillatorType: 'sine',
        envelope: {}
      }),
    triangle: () =>
      createGenericInstrument({
        oscillatorType: 'triangle',
        envelope: {}
      }),
    sawtooth: () =>
      createGenericInstrument({
        oscillatorType: 'sawtooth',
        envelope: {}
      }),
    square: () =>
      createGenericInstrument({
        oscillatorType: 'square',
        envelope: {}
      })
  },
  groups: {
    piano: () =>
      createGenericInstrument({
        oscillatorType: 'triangle',
        envelope: {
          attack: 0.01,
          decay: 0.3,
          sustainLevel: 0.7,
          release: 0.5
        }
      }),
    chromaticPercussion: () =>
      createGenericInstrument({
        oscillatorType: 'square',
        envelope: {
          decay: 1,
          attack: 1,
          sustainLevel: 0.001,
          release: 0.5
        }
      }),
    organ: () =>
      createGenericInstrument({
        oscillatorType: 'sawtooth',
        envelope: {
          release: 0.1
        },
        gainMultiplier: 0.8
      }),
    guitar: () =>
      createGenericInstrument({
        oscillatorType: 'sawtooth',
        envelope: {
          attack: 0.005,
          decay: 1.0,
          sustainLevel: 0.3,
          release: 0.2
        }
      }),
    bass: () =>
      createGenericInstrument({
        oscillatorType: 'triangle',
        envelope: {
          attack: 0.02,
          release: 0.3
        }
      }),
    strings: () =>
      createGenericInstrument({
        oscillatorType: 'sawtooth',
        envelope: {
          attack: 0.1,
          release: 0.4
        },
        gainMultiplier: 0.7
      }),
    ensemble: () =>
      createGenericInstrument({
        oscillatorType: 'sine',
        envelope: {
          attack: 0.15,
          release: 0.6
        },
        gainMultiplier: 0.6
      }),
    brass: () =>
      createGenericInstrument({
        oscillatorType: 'square',
        envelope: {
          attack: 0.05,
          decay: 0.2,
          sustainLevel: 0.8,
          release: 0.2
        }
      }),
    reed: () =>
      createGenericInstrument({
        oscillatorType: 'triangle',
        envelope: {
          attack: 0.08,
          release: 0.3
        },
        gainMultiplier: 0.7
      }),
    pipe: () =>
      createGenericInstrument({
        oscillatorType: 'sine',
        envelope: {
          attack: 0.06,
          release: 0.25
        },
        gainMultiplier: 0.6
      }),
    synthLead: () =>
      createGenericInstrument({
        oscillatorType: 'sawtooth',
        envelope: {
          release: 0.1
        },
        gainMultiplier: 0.8
      }),
    synthPad: () =>
      createGenericInstrument({
        oscillatorType: 'sine',
        envelope: {
          attack: 0.3,
          release: 1.0
        },
        gainMultiplier: 0.5
      }),
    synthEffects: () =>
      createGenericInstrument({
        oscillatorType: 'square',
        envelope: {
          attack: 0.1,
          decay: 0.5,
          sustainLevel: 0.3,
          release: 0.8
        },
        gainMultiplier: 0.6
      }),
    ethnic: () =>
      createGenericInstrument({
        oscillatorType: 'triangle',
        envelope: {
          attack: 0.03,
          decay: 0.8,
          sustainLevel: 0.4,
          release: 0.4
        },
        gainMultiplier: 0.7
      }),
    soundEffects: () =>
      createGenericInstrument({
        oscillatorType: 'square',
        envelope: {
          decay: 0.2,
          sustainLevel: 0.8,
          release: 1.0
        },
        gainMultiplier: 0.5
      })
  }
}

export const instrumentForProgramNumber = (programNumber: number) => {
  const conditions: [(number: number) => boolean, () => Instrument][] = [
    [Spec.GeneralMidiInstrument.isPiano, instruments.groups.piano],
    [
      Spec.GeneralMidiInstrument.isChromaticPercussion,
      instruments.groups.chromaticPercussion
    ],
    [Spec.GeneralMidiInstrument.isOrgan, instruments.groups.organ],
    [Spec.GeneralMidiInstrument.isGuitar, instruments.groups.guitar],
    [Spec.GeneralMidiInstrument.isBass, instruments.groups.bass],
    [Spec.GeneralMidiInstrument.isStrings, instruments.groups.strings],
    [Spec.GeneralMidiInstrument.isEnsemble, instruments.groups.ensemble],
    [Spec.GeneralMidiInstrument.isBrass, instruments.groups.brass],
    [Spec.GeneralMidiInstrument.isReed, instruments.groups.reed],
    [Spec.GeneralMidiInstrument.isPipe, instruments.groups.pipe],
    [Spec.GeneralMidiInstrument.isSynthLead, instruments.groups.synthLead],
    [Spec.GeneralMidiInstrument.isSynthPad, instruments.groups.synthPad],
    [
      Spec.GeneralMidiInstrument.isSynthEffects,
      instruments.groups.synthEffects
    ],
    [Spec.GeneralMidiInstrument.isEthnic, instruments.groups.ethnic],
    [Spec.GeneralMidiInstrument.isSoundEffects, instruments.groups.soundEffects]
  ]

  const match = conditions.find(([pred, _]) => pred(programNumber))

  if (!match) {
    console.info(
      'unhandled instrument',
      Spec.GeneralMidiInstrument.InstrumentLookup[
        programNumber as Spec.GeneralMidiInstrument.Instrument
      ]
    )
    return silent
  }

  return match[1]()
}
