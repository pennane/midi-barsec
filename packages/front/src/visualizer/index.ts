function analyzerPls(ctx: AudioContext) {
  const analyser = ctx.createAnalyser()
  analyser.connect(ctx.destination)
}
