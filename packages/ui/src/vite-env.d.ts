/// <reference types="vite/client" />

declare module '*.mid?arraybuffer' {
  const content: ArrayBuffer
  export default content
}
