import { AudioInit } from './classes/audio-init'
import { Page } from './classes/page'
import { WaveGenerator } from './classes/wave-generator'
import { AnimationRunner } from './classes/animation-runner'

class Main {
    static init () {
        const ENV = this.initEnvironment()

        AudioInit.setupAudio(ENV)
        Page.setupListeners(ENV)
        Page.setupDimensionsAndCanvas(ENV)
        WaveGenerator.createSpotifyWavesSet(ENV)

        const runner = new AnimationRunner(ENV)
        runner.startAnimation()
    }

    static initEnvironment () {
        const ENV = {
            height: 0,
            width: 0,
            canvas: document.getElementById('background'),
            audioCtx: new (AudioContext || webkitAudioContext)(),
            waves: [],
        }

        ENV.ctx = ENV.canvas.getContext('2d')

        return ENV
    }
}

window.onload = Main.init.bind(Main)
