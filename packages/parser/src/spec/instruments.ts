// https://en.wikipedia.org/wiki/General_MIDI

const invert = <
  A extends string | number,
  B extends string | number,
  R extends Record<A, B>
>(
  x: R
): {
  [K in R[keyof R]]: { [P in keyof R]: R[P] extends K ? P : never }[keyof R]
} => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {}
  for (const [key, value] of Object.entries(x)) {
    result[value as keyof typeof result] = key
  }
  return result
}

const createTypeGuard =
  <T extends number>(index: Record<T, string>) =>
  (x: number): x is T =>
    !!index[x as T]

const Piano = {
  AcousticGrandPiano: 0,
  BrightAcousticPiano: 1,
  ElectricGrandPiano: 2,
  HonkyTonkPiano: 3,
  ElectricPiano1: 4,
  ElectricPiano2: 5,
  Harpsichord: 6,
  Clavinet: 7
} as const

const PianoLookup = invert(Piano)
type Piano = (typeof Piano)[keyof typeof Piano]
export const isPiano = createTypeGuard<Piano>(PianoLookup)

const ChromaticPercussion = {
  Celesta: 8,
  Glockenspiel: 9,
  MusicBox: 10,
  Vibraphone: 11,
  Marimba: 12,
  Xylophone: 13,
  TubularBells: 14,
  Dulcimer: 15
} as const

const ChromaticPercussionLookup = invert(ChromaticPercussion)
export type ChromaticPercussion =
  (typeof ChromaticPercussion)[keyof typeof ChromaticPercussion]
export const isChromaticPercussion = createTypeGuard<ChromaticPercussion>(
  ChromaticPercussionLookup
)

const Organ = {
  DrawbarOrgan: 16,
  PercussiveOrgan: 17,
  RockOrgan: 18,
  ChurchOrgan: 19,
  ReedOrgan: 20,
  Accordion: 21,
  Harmonica: 22,
  TangoAccordion: 23
} as const

const OrganLookup = invert(Organ)
export type Organ = (typeof Organ)[keyof typeof Organ]
export const isOrgan = createTypeGuard<Organ>(OrganLookup)

const Guitar = {
  NylonStringGuitar: 24,
  SteelStringGuitar: 25,
  ElectricJazzGuitar: 26,
  ElectricCleanGuitar: 27,
  ElectricMutedGuitar: 28,
  OverdrivenGuitar: 29,
  DistortionGuitar: 30,
  GuitarHarmonics: 31
} as const

const GuitarLookup = invert(Guitar)
export type Guitar = (typeof Guitar)[keyof typeof Guitar]
export const isGuitar = createTypeGuard<Guitar>(GuitarLookup)

const Bass = {
  AcousticBass: 32,
  ElectricBassFinger: 33,
  ElectricBassPick: 34,
  FretlessBass: 35,
  SlapBass1: 36,
  SlapBass2: 37,
  SynthBass1: 38,
  SynthBass2: 39
} as const

const BassLookup = invert(Bass)
export type Bass = (typeof Bass)[keyof typeof Bass]
export const isBass = createTypeGuard<Bass>(BassLookup)

const Strings = {
  Violin: 40,
  Viola: 41,
  Cello: 42,
  Contrabass: 43,
  TremoloStrings: 44,
  PizzicatoStrings: 45,
  OrchestralHarp: 46,
  Timpani: 47
} as const

const StringsLookup = invert(Strings)
export type Strings = (typeof Strings)[keyof typeof Strings]
export const isStrings = createTypeGuard<Strings>(StringsLookup)

const Ensemble = {
  StringEnsemble1: 48,
  StringEnsemble2: 49,
  SynthStrings1: 50,
  SynthStrings2: 51,
  ChoirAahs: 52,
  VoiceOohs: 53,
  SynthVoice: 54,
  OrchestraHit: 55
} as const

const EnsembleLookup = invert(Ensemble)
export type Ensemble = (typeof Ensemble)[keyof typeof Ensemble]
export const isEnsemble = createTypeGuard<Ensemble>(EnsembleLookup)

const Brass = {
  Trumpet: 56,
  Trombone: 57,
  Tuba: 58,
  MutedTrumpet: 59,
  FrenchHorn: 60,
  BrassSection: 61,
  SynthBrass1: 62,
  SynthBrass2: 63
} as const

const BrassLookup = invert(Brass)
export type Brass = (typeof Brass)[keyof typeof Brass]
export const isBrass = createTypeGuard<Brass>(BrassLookup)

const Reed = {
  SopranoSax: 64,
  AltoSax: 65,
  TenorSax: 66,
  BaritoneSax: 67,
  Oboe: 68,
  EnglishHorn: 69,
  Bassoon: 70,
  Clarinet: 71
} as const

const ReedLookup = invert(Reed)
export type Reed = (typeof Reed)[keyof typeof Reed]
export const isReed = createTypeGuard<Reed>(ReedLookup)

const Pipe = {
  Piccolo: 72,
  Flute: 73,
  Recorder: 74,
  PanFlute: 75,
  BlownBottle: 76,
  Shakuhachi: 77,
  Whistle: 78,
  Ocarina: 79
} as const

const PipeLookup = invert(Pipe)
export type Pipe = (typeof Pipe)[keyof typeof Pipe]
export const isPipe = createTypeGuard<Pipe>(PipeLookup)

const SynthLead = {
  Lead1Square: 80,
  Lead2Sawtooth: 81,
  Lead3Calliope: 82,
  Lead4Chiff: 83,
  Lead5Charang: 84,
  Lead6Voice: 85,
  Lead7Fifths: 86,
  Lead8BassLead: 87
} as const

const SynthLeadLookup = invert(SynthLead)
export type SynthLead = (typeof SynthLead)[keyof typeof SynthLead]
export const isSynthLead = createTypeGuard<SynthLead>(SynthLeadLookup)

const SynthPad = {
  Pad1NewAge: 88,
  Pad2Warm: 89,
  Pad3Polysynth: 90,
  Pad4Choir: 91,
  Pad5Bowed: 92,
  Pad6Metallic: 93,
  Pad7Halo: 94,
  Pad8Sweep: 95
} as const

const SynthPadLookup = invert(SynthPad)
export type SynthPad = (typeof SynthPad)[keyof typeof SynthPad]
export const isSynthPad = createTypeGuard<SynthPad>(SynthPadLookup)

const SynthEffects = {
  FX1Rain: 96,
  FX2Soundtrack: 97,
  FX3Crystal: 98,
  FX4Atmosphere: 99,
  FX5Brightness: 100,
  FX6Goblins: 101,
  FX7Echoes: 102,
  FX8SciFi: 103
} as const

const SynthEffectsLookup = invert(SynthEffects)
export type SynthEffects = (typeof SynthEffects)[keyof typeof SynthEffects]
export const isSynthEffects = createTypeGuard<SynthEffects>(SynthEffectsLookup)

const Ethnic = {
  Sitar: 104,
  Banjo: 105,
  Shamisen: 106,
  Koto: 107,
  Kalimba: 108,
  Bagpipe: 109,
  Fiddle: 110,
  Shanai: 111
} as const

const EthnicLookup = invert(Ethnic)
export type Ethnic = (typeof Ethnic)[keyof typeof Ethnic]
export const isEthnic = createTypeGuard<Ethnic>(EthnicLookup)

const Percussive = {
  TinkleBell: 112,
  Agogo: 113,
  SteelDrums: 114,
  Woodblock: 115,
  TaikoDrum: 116,
  MelodicTom: 117,
  SynthDrum: 118,
  ReverseCymbal: 119
} as const
const PercussiveLookup = invert(Percussive)
export type Percussive = (typeof Percussive)[keyof typeof Percussive]
export const isPercussive = createTypeGuard<Percussive>(PercussiveLookup)

const SoundEffects = {
  GuitarFretNoise: 120,
  BreathNoise: 121,
  Seashore: 122,
  BirdTweet: 123,
  TelephoneRing: 124,
  Helicopter: 125,
  Applause: 126,
  Gunshot: 127
} as const

const SoundEffectsLookup = invert(SoundEffects)
export type SoundEffects = (typeof SoundEffects)[keyof typeof SoundEffects]
export const isSoundEffects = createTypeGuard<SoundEffects>(SoundEffectsLookup)

export const Instrument = {
  ...Piano,
  ...ChromaticPercussion,
  ...Organ,
  ...Guitar,
  ...Bass,
  ...Strings,
  ...Ensemble,
  ...Brass,
  ...Reed,
  ...Pipe,
  ...SynthLead,
  ...SynthPad,
  ...SynthEffects,
  ...Ethnic,
  ...Percussive,
  ...SoundEffects
}

export const InstrumentLookup = invert(Instrument)
export type Instrument = (typeof Instrument)[keyof typeof Instrument]
export const isInstrument = createTypeGuard<Instrument>(InstrumentLookup)

export const Percussion = {
  AcousticBassDrum: 35,
  BassDrum1: 36,
  SideStick: 37,
  AcousticSnare: 38,
  HandClap: 39,
  ElectricSnare: 40,
  LowFloorTom: 41,
  ClosedHiHat: 42,
  HighFloorTom: 43,
  PedalHiHat: 44,
  LowTom: 45,
  OpenHiHat: 46,
  LowMidTom: 47,
  HiMidTom: 48,
  CrashCymbal1: 49,
  HighTom: 50,
  RideCymbal1: 51,
  ChineseCymbal: 52,
  RideBell: 53,
  Tambourine: 54,
  SplashCymbal: 55,
  Cowbell: 56,
  CrashCymbal2: 57,
  Vibraslap: 58,
  RideCymbal2: 59,
  HiBongo: 60,
  LowBongo: 61,
  MuteHiConga: 62,
  OpenHiConga: 63,
  LowConga: 64,
  HighTimbale: 65,
  LowTimbale: 66,
  HighAgogo: 67,
  LowAgogo: 68,
  Cabasa: 69,
  Maracas: 70,
  ShortWhistle: 71,
  LongWhistle: 72,
  ShortGuiro: 73,
  LongGuiro: 74,
  Claves: 75,
  HiWoodBlock: 76,
  LowWoodBlock: 77,
  MuteCuica: 78,
  OpenCuica: 79,
  MuteTriangle: 80,
  OpenTriangle: 81
} as const

const PercussionLookup = invert(Percussion)
export type Percussion = (typeof Percussion)[keyof typeof Percussion]
export const isPercussion = createTypeGuard<Percussion>(PercussionLookup)
