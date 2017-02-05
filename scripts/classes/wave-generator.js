import { Wave } from './wave'

export class WaveGenerator {

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
