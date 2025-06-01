import { Spec } from '../../../parser'
import { PercussionConfig } from './models'

export const PERCUSSION_CONFIGS = {
  [Spec.GeneralMidiInstrument.Percussion.AcousticBassDrum]: {
    type: 'oscillator',
    frequency: 60,
    duration: 0.5,
    volume: 1.0,
    filterType: 'lowpass',
    filterFrequency: 200,
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.4 }
  },
  [Spec.GeneralMidiInstrument.Percussion.BassDrum1]: {
    type: 'oscillator',
    frequency: 50,
    duration: 0.4,
    volume: 1.0,
    filterType: 'lowpass',
    filterFrequency: 180,
    envelope: { attack: 0.01, decay: 0.08, sustain: 0.2, release: 0.3 }
  },
  [Spec.GeneralMidiInstrument.Percussion.AcousticSnare]: {
    type: 'hybrid',
    frequency: 200,
    duration: 0.2,
    volume: 1.0,
    filterType: 'bandpass',
    filterFrequency: 2000,
    filterQ: 1,
    envelope: { attack: 0.01, decay: 0.05, sustain: 0.1, release: 0.14 }
  },
  [Spec.GeneralMidiInstrument.Percussion.ElectricSnare]: {
    type: 'hybrid',
    frequency: 250,
    duration: 0.15,
    volume: 0.8,
    filterType: 'bandpass',
    filterFrequency: 2500,
    filterQ: 1.5,
    envelope: { attack: 0.005, decay: 0.04, sustain: 0.05, release: 0.1 }
  },
  [Spec.GeneralMidiInstrument.Percussion.ClosedHiHat]: {
    type: 'noise',
    duration: 0.1,
    volume: 0.6,
    filterType: 'highpass',
    filterFrequency: 8000,
    filterQ: 2,
    envelope: { attack: 0.001, decay: 0.02, sustain: 0.01, release: 0.07 }
  },
  [Spec.GeneralMidiInstrument.Percussion.PedalHiHat]: {
    type: 'noise',
    duration: 0.08,
    volume: 0.5,
    filterType: 'highpass',
    filterFrequency: 9000,
    filterQ: 2.5,
    envelope: { attack: 0.001, decay: 0.015, sustain: 0.005, release: 0.06 }
  },
  [Spec.GeneralMidiInstrument.Percussion.OpenHiHat]: {
    type: 'noise',
    duration: 0.3,
    volume: 0.6,
    filterType: 'highpass',
    filterFrequency: 7000,
    filterQ: 1.5,
    envelope: { attack: 0.001, decay: 0.05, sustain: 0.2, release: 0.25 }
  },
  [Spec.GeneralMidiInstrument.Percussion.CrashCymbal1]: {
    type: 'noise',
    duration: 2.0,
    volume: 0.5,
    filterType: 'bandpass',
    filterFrequency: 5000,
    filterQ: 0.5,
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 1.3 }
  },
  [Spec.GeneralMidiInstrument.Percussion.CrashCymbal2]: {
    type: 'noise',
    duration: 1.8,
    volume: 0.4,
    filterType: 'bandpass',
    filterFrequency: 4500,
    filterQ: 0.6,
    envelope: { attack: 0.01, decay: 0.25, sustain: 0.35, release: 1.2 }
  },
  [Spec.GeneralMidiInstrument.Percussion.RideCymbal1]: {
    type: 'noise',
    duration: 1.0,
    volume: 0.5,
    filterType: 'bandpass',
    filterFrequency: 6000,
    filterQ: 1,
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.6 }
  },
  [Spec.GeneralMidiInstrument.Percussion.RideCymbal2]: {
    type: 'noise',
    duration: 0.8,
    volume: 0.5,
    filterType: 'bandpass',
    filterFrequency: 5500,
    filterQ: 1.2,
    envelope: { attack: 0.005, decay: 0.08, sustain: 0.25, release: 0.5 }
  },
  [Spec.GeneralMidiInstrument.Percussion.LowFloorTom]: {
    type: 'oscillator',
    frequency: 80,
    duration: 0.4,
    volume: 0.8,
    filterType: 'lowpass',
    filterFrequency: 500,
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.3 }
  },
  [Spec.GeneralMidiInstrument.Percussion.LowTom]: {
    type: 'oscillator',
    frequency: 100,
    duration: 0.35,
    volume: 0.8,
    filterType: 'lowpass',
    filterFrequency: 600,
    envelope: { attack: 0.01, decay: 0.08, sustain: 0.15, release: 0.26 }
  },
  [Spec.GeneralMidiInstrument.Percussion.LowMidTom]: {
    type: 'oscillator',
    frequency: 120,
    duration: 0.3,
    volume: 0.8,
    filterType: 'lowpass',
    filterFrequency: 700,
    envelope: { attack: 0.01, decay: 0.07, sustain: 0.12, release: 0.22 }
  },
  [Spec.GeneralMidiInstrument.Percussion.HiMidTom]: {
    type: 'oscillator',
    frequency: 150,
    duration: 0.25,
    volume: 0.8,
    filterType: 'lowpass',
    filterFrequency: 800,
    envelope: { attack: 0.01, decay: 0.06, sustain: 0.1, release: 0.18 }
  },
  [Spec.GeneralMidiInstrument.Percussion.HighFloorTom]: {
    type: 'oscillator',
    frequency: 180,
    duration: 0.2,
    volume: 0.8,
    filterType: 'lowpass',
    filterFrequency: 900,
    envelope: { attack: 0.01, decay: 0.05, sustain: 0.08, release: 0.14 }
  },
  [Spec.GeneralMidiInstrument.Percussion.HighTom]: {
    type: 'oscillator',
    frequency: 200,
    duration: 0.18,
    volume: 0.8,
    filterType: 'lowpass',
    filterFrequency: 1000,
    envelope: { attack: 0.01, decay: 0.04, sustain: 0.06, release: 0.12 }
  },
  [Spec.GeneralMidiInstrument.Percussion.SideStick]: {
    type: 'oscillator',
    frequency: 1000,
    duration: 0.05,
    volume: 0.6,
    filterType: 'highpass',
    filterFrequency: 800,
    envelope: { attack: 0.001, decay: 0.01, sustain: 0.02, release: 0.04 }
  },
  [Spec.GeneralMidiInstrument.Percussion.HandClap]: {
    type: 'noise',
    duration: 0.1,
    volume: 0.7,
    filterType: 'bandpass',
    filterFrequency: 1500,
    filterQ: 2,
    envelope: { attack: 0.01, decay: 0.03, sustain: 0.02, release: 0.05 }
  },
  [Spec.GeneralMidiInstrument.Percussion.SplashCymbal]: {
    type: 'noise',
    duration: 0.8,
    volume: 0.5,
    filterType: 'bandpass',
    filterFrequency: 6500,
    filterQ: 1.5,
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.2, release: 0.5 }
  },
  [Spec.GeneralMidiInstrument.Percussion.RideBell]: {
    type: 'oscillator',
    frequency: 2000,
    duration: 0.3,
    volume: 0.6,
    filterType: 'bandpass',
    filterFrequency: 2000,
    filterQ: 3,
    envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.2 }
  },
  [Spec.GeneralMidiInstrument.Percussion.Cowbell]: {
    type: 'oscillator',
    frequency: 800,
    duration: 0.2,
    volume: 0.7,
    filterType: 'bandpass',
    filterFrequency: 800,
    filterQ: 2,
    envelope: { attack: 0.01, decay: 0.05, sustain: 0.05, release: 0.1 }
  },
  [Spec.GeneralMidiInstrument.Percussion.Tambourine]: {
    type: 'noise',
    duration: 0.3,
    volume: 0.4,
    filterType: 'highpass',
    filterFrequency: 5000,
    filterQ: 1,
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.2 }
  }
} as { [key in Spec.GeneralMidiInstrument.Percussion]?: PercussionConfig }
