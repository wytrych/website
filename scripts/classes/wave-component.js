export class WaveComponent {

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
