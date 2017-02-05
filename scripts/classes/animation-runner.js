export class AnimationRunner {
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
