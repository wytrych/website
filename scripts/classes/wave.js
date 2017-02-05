import { WaveComponent } from './wave-component'
import { AudioSignal } from './audio-signal'

export class Wave {
	constructor (waveSettings, ctx, ENV) {
        this.ctx = ctx
        this.GAP_MULTIPLIER = 40

		this.numOfWaves = 8
		this.waves = []

		this.waveSettings = waveSettings

        if (!waveSettings.isSilent)
            this.signal = new AudioSignal(waveSettings, ENV)

        this.phaseOut = false
        this.defunct = false

		for (let i = 0; i < this.numOfWaves; i++)
			this.createWave(i)
	}

	createWave (i) {
        // Gap is unsynced with framerate on purpose to add a bit of a random shift
		const gap = Math.round((i / this.numOfWaves) * this.waveSettings.duration) * this.GAP_MULTIPLIER
		setTimeout(() => {
            if (!this.phaseOut)
                this.waves[i] = new WaveComponent(this.waveSettings, this.ctx)
		}, gap)
	}

	spreadStep () {
        let summaricAlpha = 0
		this.waves.forEach((wave, i) => {
			wave.spreadStep()
            summaricAlpha += wave.currentAlpha
			if (wave.defunct)
                this.replaceOrClearWave(i)
		})

        if (this.signal)
            this.signal.changeGain(summaricAlpha)

        this.waves = this.waves.filter((wave) => wave !== null)
        if (this.phaseOut && this.waves.length === 0)
            this.defunct = true
	}

    replaceOrClearWave (i) {
        if (this.phaseOut)
            this.waves[i] = null
        else
            this.waves[i] = new WaveComponent(this.waveSettings, this.ctx)
    }

    repositionHeight (amount) {
        this.waves.forEach((wave) => wave.repositionHeight(amount))
    }
}
