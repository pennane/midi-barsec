# midi-barsec

TypeScript MIDI file parsing, playback, and visualization.

- **MIDI Parser** - MIDI file parser with support for standard events
- **MIDI Player** - Web Audio API-based MIDI playback

Test live at [pennanen.dev](https://midi-barsec.pennanen.dev/)

## Packages

This monorepo contains three independent packages:

### 📦 `parser`

MIDI file parser package that handles Standard MIDI File format parsing.

- Memory-efficient streaming parser

### 📦 `player`

MIDI playback engine using Web Audio API with customizable sound synthesis.

- Real-time MIDI playback with precise timing

### 📦 `ui`

Basic frameworkless ui


## Getting Started

### Prerequisites

- Node
- pnpm (recommended) or npm

### Installation

```bash
git clone git@github.com:pennane/midi-barsec.git
cd midi-parsing
pnpm install
pnpm build
```

### Development

```bash
# Start development server
pnpm dev

# Build all packages
pnpm build

# Build individual packages
pnpm run build:parser
pnpm run build:player
pnpm run build:ui
```

## Usage

### Parser

```typescript
import { createMidiParser } from 'parser'

// Parse a MIDI file
const midiFile = await fetch('song.mid').then(r => r.arrayBuffer())
const midi = createMidiParser(midiFile)

// Get duration
const duration = midi.duration()

// Read events
for (const { event, deltaTime } of midi.reader()) {
  console.log('Event:', event, 'Delta:', deltaTime)
}
```

### Player

```typescript
import { createPlayer } from 'player'
import { createMidiParser } from 'parser'

// Set up audio context
const audioContext = new AudioContext()
const gainNode = audioContext.createGain()
gainNode.connect(audioContext.destination)

// Create player
const player = createPlayer(audioContext, gainNode, {
  instruments: { type: 'instruments' },
  percussion: { type: 'enabled' },
  controllers: { type: 'enabled' }
})

// Load and play MIDI
const midi = createMidiParser(midiBuffer)
await player.load(midi)
await player.play()
```

## Architecture

```sh
packages/
├── parser/          # MIDI file parsing
│   ├── src/
│   │   ├── spec/    # MIDI specification types
│   │   ├── lib.ts   # Utility functions
│   │   └── ...
│   └── dist/        # Compiled output
├── player/          # MIDI playback engine  
│   ├── src/
│   │   ├── processors/     # Event processors
│   │   ├── instruments.ts  # Sound synthesis
│   │   └── ...
│   └── dist/        # Compiled output
└── ui/              # Web application
    ├── src/
    │   ├── ui/      # UI components
    │   └── ...
    └── dist/        # Built application
```

## References

- [Standard MIDI File Format](https://www.music.mcgill.ca/~ich/classes/mumt306/StandardMIDIfileformat.html)
- [General MIDI Specification](https://www.midi.org/specifications-old/item/gm-level-1-sound-set)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
