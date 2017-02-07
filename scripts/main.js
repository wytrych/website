import './polyfills/object-assign'

import { AudioInit } from './classes/audio-init'
import { Page } from './classes/page'
import { WaveGenerator } from './classes/wave-generator'
import { AnimationRunner } from './classes/animation-runner'

class Main {
    static init () {
        const renderingContext = Page.checkRenderingSupport()

        if (!renderingContext.support) {
            Page.setNoSupportMessage()
            Page.setupBackgroundLinkListener()
            return
        }

        this.AudioContext = AudioInit.getAudioContext()
        this.verifyAudioSupport()

        const ENV = this.initEnvironment()

        if (this.AudioContext)
            AudioInit.setupAudio(ENV)
            
        Page.setupListeners(ENV)
        Page.setupDimensionsAndCanvas(ENV)
        WaveGenerator.createStartingWavesSet(ENV)

        const runner = new AnimationRunner(ENV)
        runner.startAnimation()
    }

    static initEnvironment () {
        const ENV = {
            height: 0,
            width: 0,
            canvas: document.getElementById('background'),
            audioCtx: this.AudioContext && new this.AudioContext(),
            waves: [],
        }

        ENV.ctx = ENV.canvas.getContext('2d')

        return ENV
    }

    static verifyAudioSupport () {
        if (!this.AudioContext)
            Page.setNoAudioMessage()
    }
}

window.onload = Main.init.bind(Main)
