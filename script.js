class Wave {
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

        const newGain = summaricAlpha
        if (this.signal)
            this.signal.changeGain(newGain)

        this.waves = this.waves.filter((el) => el !== null)
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

class WaveComponent {

	constructor ({speed, alphaStep, red, green, blue, duration, x, y}, ctx) {
        this.ctx = ctx
		this.speed = speed

		this.red = red
		this.green = green
		this.blue = blue
		this.duration = duration

		this.alpha = 1
		this.alphaStep = alphaStep

		this.frameCount = 0
		this.radius = 0

		this.x = x
		this.y = y

		this.defunct = false
        this.DEFUNCT_LIMIT = 0.0001

        this.RADIUS_MODIFIER = 1 / 300
        this.GLOW_PERIOD = 50
	}

	spreadStep () {
		this.increment()
		this.paint()
	}

	increment () {
		this.alpha -= this.alphaStep
		this.radius += this.speed

		this.frameCount += 1
        this.frameCount %= this.GLOW_PERIOD

		if (this.alpha < this.DEFUNCT_LIMIT)
			this.defunct = true
	}

	paint () {
		this.ctx.beginPath()
		this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI)

		const R = this.red
		const G = this.green
		const B = this.blue
		const A = this.alpha * this.waveFunction(this.frameCount)

        this.currentAlpha = A * this.radius * this.RADIUS_MODIFIER
		this.ctx.fillStyle =  `rgba(${R}, ${G}, ${B}, ${A})`
		this.ctx.fill()
		this.ctx.closePath()
	}

	waveFunction (position) {
		const howFarInPeriod = (position / this.GLOW_PERIOD)
		const modifier = 8

		return (Math.sin(2 * Math.PI * howFarInPeriod) + 1) / modifier
	}

    repositionHeight (amount) {
        this.y += amount
    }

}

class AudioSignal {
    constructor ({x, y}, ENV) {
        this.MIN_FREQ = 50
        this.MAX_FREQ = 15000
        this.GAIN_MODIFIER = -0.0005
        const maxMultiplier = Math.log2(this.MAX_FREQ / this.MIN_FREQ)

        const position = (window.innerHeight - y) / window.innerHeight

        const pan = 2 * ((ENV.width - x) / ENV.width) - 1

        this.gainNode = ENV.audioCtx.createGain()
        this.gainNode.gain.value = 0

        this.oscillator = ENV.audioCtx.createOscillator()
        this.oscillator.type = 'sine'
        this.freq = this.MIN_FREQ * Math.pow(2, position * maxMultiplier)
        this.oscillator.frequency.value = this.freq
        this.oscillator.connect(this.gainNode)

        if (ENV.audioCtx.createStereoPanner) {
            this.panner = ENV.audioCtx.createStereoPanner()
            this.panner.pan.value = -pan
            this.gainNode.connect(this.panner)

            this.panner.connect(ENV.filter)
        } else
            this.gainNode.connect(ENV.filter)

        this.oscillator.start()
    }

    changeGain (newValue) {
        this.gainNode.gain.value = this.GAIN_MODIFIER * newValue
    }

}

class WaveGenerator {

    static createSpotifyWavesSet (ENV) {
        const spotifyColor = {red: 30, green: 215, blue: 96}
        ENV.waves.push(this.createRandomWave({
            x: ENV.width,
            y: ENV.height / 3,
            color: spotifyColor,
            speed: 1,
            alphaStep: 1 / 300,
            isSilent: true,
        }, ENV))

        ENV.waves.push(this.createRandomWave({
            x: 30,
            y: ENV.height - 40,
            color: spotifyColor,
            speed: 1.2,
            alphaStep: 1 / 400,
            isSilent: true,
        }, ENV))
    }

    static createRandomWave ({x, y, color, speed, alphaStep, isSilent}, ENV) {
        const finalColor = color || this.generateRandomColor()

        const waveSettings = Object.assign({}, {
            speed: this.isDef(speed) ? speed : (Math.random() * 0.8 + 0.2),
            alphaStep: this.isDef(alphaStep) ? alphaStep : (Math.random() * 0.5 + 0.5) / 200,
            duration: 400 + Math.random() * 150,
            x: this.isDef(x) ? x : Math.round(Math.random() * ENV.width),
            y: this.isDef(y) ? y : Math.round(Math.random() * ENV.height),
            isSilent,
        }, finalColor)

        return new Wave(waveSettings, ENV.ctx, ENV)
    }

    static isDef (value) {
        return typeof value !== 'undefined'
    }

    static generateRandomColor () {
        let color
        let i = 0
        const iterationSafeguardLimit = 100000
        do {
            color = {
                red: this.randomColor(),
                green: this.randomColor(),
                blue: this.randomColor(),
            }
            i++
        } while (i < iterationSafeguardLimit && color.red + color.green + color.blue < 127)

        return color
    }

    static randomColor () {
        const min = 10
        return Math.round(min + Math.random() * (127 - min))
    }

}

class AnimationRunner {
    constructor (ENV) {
        this.lastFrameTime = Date.now()
        this.ENV = ENV

        const framerate = 25
        this.msPerFrame = 1000 / framerate
    }

    startAnimation () {
        this.processFrame()
    }

    processFrame () {
        const currentTime = Date.now()

        if (currentTime - this.lastFrameTime > this.msPerFrame) {
            window.requestAnimationFrame(this.drawFrame.bind(this))
            this.lastFrameTime = currentTime
        } else
            window.requestAnimationFrame(this.processFrame.bind(this))
    }

    drawFrame () {
        const alphaFactor = 0.7
        this.ENV.ctx.fillStyle = `rgba(0, 0, 0, ${alphaFactor})`
        this.ENV.ctx.fillRect(0, 0,  this.ENV.width, this.ENV.height)
        this.ENV.waves.forEach((wave) => {
            wave.spreadStep()
        })

        this.ENV.waves = this.ENV.waves.filter((wave) => !wave.defunct)

        window.requestAnimationFrame(this.processFrame.bind(this))
    }

}

class Page {

    static setupDimensionsAndCanvas (ENV) {
        ENV.canvas.height = 0
        ENV.canvas.width = 0

        ENV.height = this.getHeight()
        ENV.width = document.body.clientWidth

        ENV.canvas.width = ENV.width
        ENV.canvas.height = ENV.height
    }

    static getHeight () {
        const body = document.body
        const html = document.documentElement

        return Math.max(
            body.scrollHeight,
            body.offsetHeight,
            html.clientHeight,
            html.scrollHeight,
            html.offsetHeight
        )
    }

    static setupBackgroundLinkListener (waves, ENV) {
        const backgroundLink = document.getElementById('show-background-link')
        backgroundLink.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            document.body.classList.add('hide-main-text')
            this.fadeOutBackgroundWaves(waves)
            this.addCanvasListener(ENV)
        })
    }

    static fadeOutBackgroundWaves (waves) {
        waves.forEach((wave) => {
            wave.phaseOut = true
        })
    }

    static addCanvasListener (ENV) {
        document.body.addEventListener('click', (e) => {
            document.getElementById('empty-state-text').classList.add('hide')
            const coordinates = this.getMousePos(e)
            ENV.waves.push(WaveGenerator.createRandomWave(coordinates, ENV))
        })
    }

    static getMousePos (evt) {
        return {
            x: evt.pageX - window.pageXOffset,
            y: evt.pageY - window.pageYOffset,
        }
    }
}

class AudioInit {
    static setupAudio (ENV) {
        this.setupMasterGain(ENV)
        this.setupBassBoostFilter(ENV)
        this.setupHighDampFilter(ENV)
    }

    static setupMasterGain (ENV) {
        ENV.masterGain = ENV.audioCtx.createGain()
        ENV.masterGain.gain.value = 250
        ENV.masterGain.connect(ENV.audioCtx.destination)
    }

    static setupBassBoostFilter (ENV) {
        ENV.filter2 = ENV.audioCtx.createBiquadFilter()
        ENV.filter2.type = 'highshelf'
        ENV.filter2.frequency.value = 700
        ENV.filter2.Q.value = 0.001
        ENV.filter2.gain.value = -10
        ENV.filter2.connect(ENV.masterGain)
    }

    static setupHighDampFilter(ENV) {
        ENV.filter = ENV.audioCtx.createBiquadFilter()
        ENV.filter.type = 'highshelf'
        ENV.filter.frequency.value = 7000
        ENV.filter.gain.value = -30
        ENV.filter.connect(ENV.filter2)
    }
}

class Main {
    static init () {
        const ENV = this.initEnvironment()

        AudioInit.setupAudio(ENV)
        Page.setupBackgroundLinkListener(ENV.waves, ENV)
        Page.setupDimensionsAndCanvas(ENV)

        WaveGenerator.createSpotifyWavesSet(ENV)

        const runner = new AnimationRunner(ENV)
        runner.startAnimation()

        this.addListeners(ENV)
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

    static addListeners (ENV) {
        window.addEventListener('resize', () => Page.setupDimensionsAndCanvas(ENV))

        const mainElement = document.getElementsByTagName('main')[0]
        mainElement.addEventListener('webkitTransitionEnd', hideMainElementAndReadjustCanvas)
        mainElement.addEventListener('mozTransitionEnd', hideMainElementAndReadjustCanvas)
        mainElement.addEventListener('oTransitionEnd', hideMainElementAndReadjustCanvas)
        mainElement.addEventListener('msTransitionEnd', hideMainElementAndReadjustCanvas)
        mainElement.addEventListener('transitionend', hideMainElementAndReadjustCanvas)

        function hideMainElementAndReadjustCanvas () {
            this.style.display = 'none'
            ENV.waves.forEach((wave) => wave.repositionHeight(-window.pageYOffset))
            Page.setupDimensionsAndCanvas(ENV)
        }
    }

}

window.onload = Main.init.bind(Main)
