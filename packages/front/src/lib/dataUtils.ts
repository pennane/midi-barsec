/**
 * Reads a variable-length quantity from a DataView
 * core MIDI parsing utility used throughout the MIDI specification
 *
 * @param view The DataView to read from
 * @param offset The byte offset to start reading from
 * @returns An object containing the parsed value and the number of bytes consumed
 */
export function readVariableLengthQuantity(
  view: DataView,
  offset: number
): { value: number; length: number } {
  let value = 0
  let length = 0
  let byte: number

  do {
    byte = view.getUint8(offset + length)
    value = (value << 7) | (byte & 0x7f)
    length++
  } while (byte & 0x80)

  return { value, length }
}

/**
 * Reads a 24-bit big-endian integer from a DataView
 * used for MIDI tempo values
 *
 * @param view The DataView to read from
 * @param offset The byte offset to start reading from
 * @returns The 24-bit integer value
 */
export function readUint24BE(view: DataView, offset: number): number {
  return (
    (view.getUint8(offset) << 16) |
    (view.getUint8(offset + 1) << 8) |
    view.getUint8(offset + 2)
  )
}

export function ceilPowerOfTwo(n: number) {
  if (n <= 1) return 1
  const exponent = Math.ceil(Math.log2(n))
  return 2 ** exponent
}
