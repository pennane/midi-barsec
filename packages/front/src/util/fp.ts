export function ensureOnce(func: () => void) {
  let called = false
  return function () {
    if (called) return
    called = true
    func()
  }
}
