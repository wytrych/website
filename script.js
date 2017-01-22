const buffers = [
	document.getElementById('background-1'),
	document.getElementById('background-2'),
]

const HEIGHT = window.outerHeight
const WIDTH = window.outerWidth

const canvases = Array.from(document.getElementsByTagName('canvas'))
canvases.forEach((canvas) => {
	canvas.width = WIDTH
	canvas.height = HEIGHT
})

let selectedItemBackground

class Wave {
	constructor (waveSettings) {
		this.numOfWaves = 8
		this.waves = []

		this.label = new Label(waveSettings)
		this.waveSettings = waveSettings

		for (let i = 0; i < this.numOfWaves; i++)
			this.createWave(i)
	}

	createWave (i) {
		const gap = Math.round((i / this.numOfWaves) * this.waveSettings.duration)
		setTimeout(() => {
			this.waves[i] = new WaveGenerator(this.waveSettings)
		}, gap * 40)
	}

	spreadStep () {
		this.waves.forEach((wave, i) => {
			wave.spreadStep()
			if (wave.defunct)
				this.waves[i] = new WaveGenerator(this.waveSettings)
		})
	}
}

class WaveGenerator {

	constructor ({speed, alphaStep, red, green, blue, duration, x, y}) {
		this.speed = speed
		this.throttle = 1

		this.flipSwitch = false
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
	}

	spreadStep () {
		this.increment()
		this.paint()
	}

	increment () {
		this.alpha -= this.alphaStep
		this.radius += this.speed
		this.frameCount += 1

		if (this.alpha < 0.0001)
			this.defunct = true
	}

	paint () {
		const canvas = buffers[0]
		const ctx = canvas.getContext('2d')
		//ctx.globalCompositeOperation = 'xor'

		ctx.beginPath()
		ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI)

		const R = this.red
		const G = this.green
		const B = this.blue
		const A = this.alpha * this.waveFunction(this.frameCount)
		ctx.fillStyle =  `rgba(${R}, ${G}, ${B}, ${A})`
		ctx.fill()
		ctx.closePath()
	}

	waveFunction (x) {
		const period = 50
		const position = x % period
		const howFarInPeriod = (position / period)
		const modifier = 8

		return (Math.sin(2 * Math.PI * howFarInPeriod) + 1) / modifier
	}

}

class BackgroundWave extends WaveGenerator {
	spreadStep () {
		if (this.speed < 0 || this.radius < Math.max(window.innerWidth, window.innerHeight)) {
			console.log('pain');
			this.increment()
		}

		if (this.radius > 0)
			this.paint()
		else
			this.defunct = true
	}

	waveFunction () {
		return 1
	}

	windBack () {
		this.speed = -this.speed
	}
}

class Label {
	constructor (waveSettings) {
		this.waveSettings = waveSettings

		if (waveSettings.label) {
			this.attachListener()
			this.moveLabel()
		}
	}

	attachListener () {
		const sectionId = this.waveSettings.label.toLowerCase()
		const section = document.getElementById(sectionId)
		section.addEventListener('click', () => {
			if (selectedItemBackground)
				selectedItemBackground.windBack()
			else
				selectedItemBackground = new BackgroundWave(Object.assign({}, this.waveSettings, {
					speed: 50,
					alphaStep: -0.0001,
					alpha: 0,
				}))
		})
	}

	moveLabel () {
		const sectionId = this.waveSettings.label.toLowerCase()
		const section = document.getElementById(sectionId)
		const x = this.waveSettings.x
		const y = this.waveSettings.y
		section.style.left = `${x}px`
		section.style.top = `${y}px`
	}

}

class CanvasBuffer {
		//canvas.style.visibility = 'hidden'
		//shownCanvas.style.visibility = 'visible'
		//const shownBufferNo = !this.flipSwitch / 1
		//const drawingBufferNo = this.flipSwitch / 1
		//const canvas = buffers[drawingBufferNo]
}

let waves = []

let takenLabelLanes = []

createWavesSet(4)
console.log(takenLabelLanes);

function createWavesSet (numberOfWaves) {
	const labels = [
		'Education',
		'Projects',
		'Experience',
		'Music',
	];
	for (let i = 0; i < numberOfWaves; i++)
		waves[i] = createRandomWave(null, null, labels[i % 4])
}

function createRandomWave (x, y, label) {
	return new Wave({
		speed: (Math.random() * 0.8 + 0.2),
		red: randomColor(),
		green: randomColor(),
		blue: randomColor(),
		alphaStep: (Math.random() * 0.5 + 0.5) / 200,
		duration: 500,
		x: x || getRandomPosition(WIDTH * 0.2),
		y: y || getRandomPosition(HEIGHT * 0.2),
		label,
	})
}

function getRandomPosition (multiplier = 1) {
    const newChoice = Math.round(Math.random()) + 1
    const previousLaneNumber = takenLabelLanes[takenLabelLanes.length - 1] || 0
    const newLaneNumber = previousLaneNumber + newChoice
    console.log(newChoice, previousLaneNumber, newLaneNumber);
    takenLabelLanes.push(newLaneNumber)

    return  Math.round(Math.random() * multiplier)
}

function randomColor () {
	const min = 0
	return Math.round(min + Math.random() * (127 - min))
}

let lastFrameTime = Date.now()
startAnimation()

function startAnimation () {
	const framerate = 25
	const msPerFrame = 1000 / framerate
	const currentTime = Date.now()

	if (currentTime - lastFrameTime > msPerFrame) {
		window.requestAnimationFrame(processFrame)
		lastFrameTime = currentTime
	} else
		window.requestAnimationFrame(startAnimation)
}

function processFrame () {
	const ctx1 = canvases[0].getContext('2d')
	const ctx2 = canvases[1].getContext('2d')
	ctx1.fillStyle = 'rgba(0, 0, 0, 0.7)'
	ctx1.fillRect(0, 0,  WIDTH, HEIGHT)
	//ctx1.clearRect(0, 0, WIDTH, HEIGHT)
	//ctx2.clearRect(0, 0, HEIGHT, WIDTH)
	waves.forEach((wave) => {
		wave.spreadStep()
	})

	if (selectedItemBackground && selectedItemBackground.defunct)
		selectedItemBackground = null
	selectedItemBackground && selectedItemBackground.spreadStep()
	window.requestAnimationFrame(startAnimation)
}

document.body.addEventListener('click', function (e) {
	if (e.target.tagName === 'CANVAS') {
		const coordinates = getMousePos(e.target, e)
		waves.push(createRandomWave(coordinates.x, coordinates.y))
		//createRandomWave(coordinates.x, coordinates.y)
	}
})

function getMousePos(canvas, evt) {
	const rect = canvas.getBoundingClientRect()
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top,
	}
}

const addressEl = document.getElementsByTagName('address')[0]
setTimeout(() => {
	addressEl.classList.add('dimmed');
}, 10000)
