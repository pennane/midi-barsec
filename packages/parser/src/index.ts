import fs from 'node:fs'
import { MidiParser } from './parser/MidiParser'

const file = process.argv.slice(2)[0]

if (!file) throw new Error('Pass file as string')

const buffer = fs.readFileSync('./data/' + file)
const parser = new MidiParser(buffer)

const midi = parser.parse()

console.info(midi)

const now = Date.now()

fs.writeFileSync(`${now}.json`, JSON.stringify(midi, undefined, 2))
