import fs from 'node:fs'
import { MidiParser } from './parser/MidiParser'

const buffer = fs.readFileSync('./data/megalol.mid')
const parser = new MidiParser(buffer)

const midi = parser.parse()

console.log(midi)

fs.writeFileSync('out.json', JSON.stringify(midi, undefined, 2))
