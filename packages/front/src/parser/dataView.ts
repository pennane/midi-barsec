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
