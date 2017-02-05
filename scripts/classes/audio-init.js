export class AudioInit {
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
