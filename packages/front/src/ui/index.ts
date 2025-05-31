import { MidiPlayer } from '../player'
import { initFileSelector } from './fileSelector'
import { initPlaybackController } from './playbackController'
import { initProgressBar } from './progressBar'
import { initializeVisualizer } from './visualizer'
import { initVolumeControl } from './volumeControl'

export function initializeUi(
  player: MidiPlayer,
  gainNode: GainNode,
  analyserNode: AnalyserNode
) {
  initProgressBar(player)
  initFileSelector(player)
  initPlaybackController(player)
  initVolumeControl(gainNode)
  initializeVisualizer(analyserNode)
}
