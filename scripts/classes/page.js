import { WaveGenerator } from './wave-generator'

export class Page {

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

    static setupListeners (ENV) {
        window.addEventListener('resize', () => this.setupDimensionsAndCanvas(ENV))
        this.setupMainTransitionEndListener(ENV)
        this.setupBackgroundLinkListener(ENV)
    }

    static setupMainTransitionEndListener (ENV) {
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

    static setupBackgroundLinkListener (ENV) {
        const backgroundLink = document.getElementById('show-background-link')
        backgroundLink.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            document.body.classList.add('hide-main-text')
            this.fadeOutBackgroundWaves(ENV.waves)
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
