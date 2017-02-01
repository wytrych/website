const GLOBALS = {
    offset: 0,
    height: 0,
    width: 0,
    canvas: document.getElementById('background'),
    audioCtx: new (window.AudioContext || window.webkitAudioContext)(),
    waves: [],
}

GLOBALS.ctx = GLOBALS.canvas.getContext('2d')

GLOBALS.masterGain = GLOBALS.audioCtx.createGain()
GLOBALS.masterGain.gain.value = 80
GLOBALS.masterGain.connect(GLOBALS.audioCtx.destination)

GLOBALS.filter = GLOBALS.audioCtx.createBiquadFilter()
GLOBALS.filter.type = 'highshelf'
GLOBALS.filter.frequency.value = 7000
GLOBALS.filter.gain.value = -50
GLOBALS.filter.connect(GLOBALS.masterGain)

class Wave {
	constructor (waveSettings) {
        this.GAP_MULTIPLIER = 40

		this.numOfWaves = 8
		this.waves = []

		this.waveSettings = waveSettings

        if (!waveSettings.isSilent)
            this.signal = new AudioSignal(waveSettings)

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
                this.waves[i] = new WaveComponent(this.waveSettings)
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
            this.waves[i] = new WaveComponent(this.waveSettings)
    }
}

class WaveComponent {

	constructor ({speed, alphaStep, red, green, blue, duration, x, y}) {
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
        this.offset = GLOBALS.offset

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
		GLOBALS.ctx.beginPath()
		GLOBALS.ctx.arc(this.x, this.y + this.offset, this.radius, 0, 2 * Math.PI)

		const R = this.red
		const G = this.green
		const B = this.blue
		const A = this.alpha * this.waveFunction(this.frameCount)

        this.currentAlpha = A * this.radius * this.RADIUS_MODIFIER
		GLOBALS.ctx.fillStyle =  `rgba(${R}, ${G}, ${B}, ${A})`
		GLOBALS.ctx.fill()
		GLOBALS.ctx.closePath()
	}

	waveFunction (position) {
		const howFarInPeriod = (position / this.GLOW_PERIOD)
		const modifier = 8

		return (Math.sin(2 * Math.PI * howFarInPeriod) + 1) / modifier
	}

}

class AudioSignal {
    constructor ({x, y}) {
        this.MIN_FREQ = 20
        this.MAX_FREQ = 15000
        this.GAIN_MODIFIER = 0.0005
        const maxMultiplier = Math.log2(this.MAX_FREQ / this.MIN_FREQ)

        const position = (window.innerHeight - y) / window.innerHeight

        const pan = 2 * ((GLOBALS.width - x) / GLOBALS.width) - 1
        this.panner = GLOBALS.audioCtx.createStereoPanner()
        this.panner.pan.value = -pan

        this.gainNode = GLOBALS.audioCtx.createGain()

        this.oscillator = GLOBALS.audioCtx.createOscillator()
        this.oscillator.type = 'sine'
        this.freq = this.MIN_FREQ * Math.pow(2, position * maxMultiplier)
        this.oscillator.frequency.value = this.freq
        this.oscillator.connect(this.gainNode)

        this.gainNode.connect(this.panner)
        this.gainNode.gain.value = 0

        this.panner.connect(GLOBALS.filter)

        this.oscillator.start()
    }

    changeGain (newValue) {
        this.gainNode.gain.value = this.GAIN_MODIFIER * newValue
    }

}

class WaveGenerator {

    static createSpotifyWavesSet () {
        const spotifyColor = {red: 30, green: 215, blue: 96}
        GLOBALS.waves.push(this.createRandomWave({
            x: GLOBALS.width,
            y: GLOBALS.height / 3,
            color: spotifyColor,
            speed: 1,
            alphaStep: 1/300,
            isSilent: true,
        }))

        GLOBALS.waves.push(this.createRandomWave({
            x: 30,
            y: GLOBALS.height - 40,
            color: spotifyColor,
            speed: 1.2,
            alphaStep: 1/400,
            isSilent: true,
        }))
    }

    static createRandomWave ({x, y, color, speed, alphaStep, isSilent}) {
        const finalColor = color || this.generateRandomColor()

        const waveSettings = Object.assign({}, {
            speed: this.isDef(speed) ? speed : (Math.random() * 0.8 + 0.2),
            alphaStep: this.isDef(alphaStep) ? alphaStep : (Math.random() * 0.5 + 0.5) / 200,
            duration: 400 + Math.random() * 150,
            x: this.isDef(x) ? x : Math.round(Math.random() * GLOBALS.width),
            y: this.isDef(y) ? y : Math.round(Math.random() * GLOBALS.height),
            isSilent,
        }, finalColor)

        return new Wave(waveSettings)
    }

    static isDef (value) {
        return typeof value !== 'undefined'
    }

    static generateRandomColor () {
        let color
        do {
            color = {
                red: this.randomColor(),
                green: this.randomColor(),
                blue: this.randomColor(),
            }
        } while (color.red + color.green + color.blue < 120)

        return color
    }

    static randomColor () {
        const min = 10
        return Math.round(min + Math.random() * (127 - min))
    }

}

class AnimationRunner {
    constructor (GLOBALS) {
        this.lastFrameTime = Date.now()
        this.GLOBALS = GLOBALS

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
        this.GLOBALS.ctx.fillStyle = `rgba(0, 0, 0, ${alphaFactor})`
        this.GLOBALS.ctx.fillRect(0, 0,  this.GLOBALS.width, this.GLOBALS.height)
        this.GLOBALS.waves.forEach((wave) => {
            wave.spreadStep()
        })

        this.GLOBALS.waves = this.GLOBALS.waves.filter((wave) => !wave.defunct)

        window.requestAnimationFrame(this.processFrame.bind(this))
    }

}

class Page {

    static setupDimensionsAndCanvas () {
        GLOBALS.height = this.getHeight()
        GLOBALS.width = document.body.clientWidth

        GLOBALS.canvas.width = GLOBALS.width
        GLOBALS.canvas.height = GLOBALS.height
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

    static setupNameDim () {
        const addressEl = document.getElementsByTagName('address')[0]
        const DIM_DELAY = 10000
        setTimeout(() => {
            addressEl.classList.add('dimmed');
        }, DIM_DELAY)
    }

    static setupBackgroundLinkListener () {
        const backgroundLink = document.getElementById('show-background-link')
        backgroundLink.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            document.body.classList.add('hide-main-text')
            this.fadeOutBackgroundWaves()
            this.addCanvasListener()
            window.addEventListener('resize', this.setupDimensionsAndCanvas.bind(this))
            GLOBALS.offset = window.pageYOffset
        })
    }

    static fadeOutBackgroundWaves () {
        GLOBALS.waves.forEach((wave) => {
            wave.phaseOut = true
        })
    }

    static addCanvasListener () {
        document.body.addEventListener('click', (e) => {
            document.getElementById('empty-state-text').classList.add('hide')
            const coordinates = this.getMousePos(e)
            GLOBALS.waves.push(WaveGenerator.createRandomWave(coordinates))
        })
    }

    static getMousePos (evt) {
        return {
            x: evt.pageX - window.pageXOffset,
            y: evt.pageY - window.pageYOffset,
        }
    }
}

Page.setupNameDim()
Page.setupBackgroundLinkListener()
Page.setupDimensionsAndCanvas()

WaveGenerator.createSpotifyWavesSet()

const runner = new AnimationRunner(GLOBALS)
runner.startAnimation()
