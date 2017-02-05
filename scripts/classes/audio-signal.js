export class AudioSignal {
    constructor ({x, y}, ENV) {
        this.position = (ENV.height - y) / ENV.height
        this.pan = -(2 * ((ENV.width - x) / ENV.width) - 1)
        this.ENV = ENV

        this.gainNode = ENV.audioCtx.createGain()
        this.gainNode.gain.value = 0

        this.createOscillator()

        if (ENV.audioCtx.createStereoPanner)
            this.createAndConnectPanner()
        else
            this.gainNode.connect(ENV.filter)

        this.oscillator.start()
    }

    createOscillator () {
        const MIN_FREQ = 50
        const MAX_FREQ = 15000
        const multiplier = Math.log2(MAX_FREQ / MIN_FREQ)

        this.oscillator = this.ENV.audioCtx.createOscillator()
        this.oscillator.type = 'sine'
        this.freq = MIN_FREQ * Math.pow(2, this.position * multiplier)
        this.oscillator.frequency.value = this.freq
        this.oscillator.connect(this.gainNode)
    }

    createAndConnectPanner () {
        this.panner = this.ENV.audioCtx.createStereoPanner()
        this.panner.pan.value = this.pan
        this.gainNode.connect(this.panner)
        this.panner.connect(this.ENV.filter)
    }

    changeGain (newValue) {
        const GAIN_MODIFIER = -0.0005
        this.gainNode.gain.value = GAIN_MODIFIER * newValue
    }

}
