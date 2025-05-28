export interface Visualizer {
  size: number
  ctx: CanvasRenderingContext2D
  init?(ctx: CanvasRenderingContext2D, size: number): void
  draw(analyser: AnalyserNode, dataArray: Uint8Array): void
  destroy?(): void
}
