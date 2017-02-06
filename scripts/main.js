import { AudioInit } from './classes/audio-init'
import { Page } from './classes/page'
import { WaveGenerator } from './classes/wave-generator'
import { AnimationRunner } from './classes/animation-runner'

class Main {
    static init () {
	const renderingContext = Page.checkRenderingSupport()

	if (!renderingContext.support) {
		Page.setNoSupportMessage()
		return
	}

	const audioContext = AudioInit.checkAudioSupport()
	this.verifyAudioSupport(audioContext)

        const ENV = this.initEnvironment(audioContext)

	if (audioContext.support)
		AudioInit.setupAudio(ENV)
	    
	Page.setupListeners(ENV)
	Page.setupDimensionsAndCanvas(ENV)
	WaveGenerator.createSpotifyWavesSet(ENV)

        const runner = new AnimationRunner(ENV)
        runner.startAnimation()
    }

    static initEnvironment (audioContext) {
        const ENV = {
            height: 0,
            width: 0,
            canvas: document.getElementById('background'),
            audioCtx: audioContext && new (AudioContext || webkitAudioContext)(),
            waves: [],
        }

        ENV.ctx = ENV.canvas.getContext('2d')

        return ENV
    }

    static verifyAudioSupport (audioContext) {
        if (!audioContext.support)
	    Page.setNoAudioMessage()
    }
}

window.onload = Main.init.bind(Main)
