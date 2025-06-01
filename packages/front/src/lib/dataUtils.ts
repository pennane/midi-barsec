export function ceilPowerOfTwo(n: number) {
  if (n <= 1) return 1
  const exponent = Math.ceil(Math.log2(n))
  return 2 ** exponent
}
