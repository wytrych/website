(function () {

'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Wave = function () {
    function Wave(waveSettings) {
        _classCallCheck(this, Wave);

        this.GAP_MULTIPLIER = 40;

        this.numOfWaves = 8;
        this.waves = [];

        this.waveSettings = waveSettings;

        if (!waveSettings.isSilent) this.signal = new AudioSignal(waveSettings);

        this.phaseOut = false;
        this.defunct = false;

        for (var i = 0; i < this.numOfWaves; i++) {
            this.createWave(i);
        }
    }

    _createClass(Wave, [{
        key: 'createWave',
        value: function createWave(i) {
            var _this = this;

            // Gap is unsynced with framerate on purpose to add a bit of a random shift
            var gap = Math.round(i / this.numOfWaves * this.waveSettings.duration) * this.GAP_MULTIPLIER;
            setTimeout(function () {
                if (!_this.phaseOut) _this.waves[i] = new WaveComponent(_this.waveSettings);
            }, gap);
        }
    }, {
        key: 'spreadStep',
        value: function spreadStep() {
            var _this2 = this;

            var summaricAlpha = 0;
            this.waves.forEach(function (wave, i) {
                wave.spreadStep();
                summaricAlpha += wave.currentAlpha;
                if (wave.defunct) _this2.replaceOrClearWave(i);
            });

            var newGain = summaricAlpha;
            if (this.signal) this.signal.changeGain(newGain);

            this.waves = this.waves.filter(function (el) {
                return el !== null;
            });
            if (this.phaseOut && this.waves.length === 0) this.defunct = true;
        }
    }, {
        key: 'replaceOrClearWave',
        value: function replaceOrClearWave(i) {
            if (this.phaseOut) this.waves[i] = null;else this.waves[i] = new WaveComponent(this.waveSettings);
        }
    }]);

    return Wave;
}();

var WaveComponent = function () {
    function WaveComponent(_ref) {
        var speed = _ref.speed,
            alphaStep = _ref.alphaStep,
            red = _ref.red,
            green = _ref.green,
            blue = _ref.blue,
            duration = _ref.duration,
            x = _ref.x,
            y = _ref.y;

        _classCallCheck(this, WaveComponent);

        this.speed = speed;

        this.red = red;
        this.green = green;
        this.blue = blue;
        this.duration = duration;

        this.alpha = 1;
        this.alphaStep = alphaStep;

        this.frameCount = 0;
        this.radius = 0;

        this.x = x;
        this.y = y;
        this.offset = GLOBALS.offset;

        this.defunct = false;
        this.DEFUNCT_LIMIT = 0.0001;

        this.RADIUS_MODIFIER = 1 / 300;
        this.GLOW_PERIOD = 50;
    }

    _createClass(WaveComponent, [{
        key: 'spreadStep',
        value: function spreadStep() {
            this.increment();
            this.paint();
        }
    }, {
        key: 'increment',
        value: function increment() {
            this.alpha -= this.alphaStep;
            this.radius += this.speed;

            this.frameCount += 1;
            this.frameCount %= this.GLOW_PERIOD;

            if (this.alpha < this.DEFUNCT_LIMIT) this.defunct = true;
        }
    }, {
        key: 'paint',
        value: function paint() {
            GLOBALS.ctx.beginPath();
            GLOBALS.ctx.arc(this.x, this.y + this.offset, this.radius, 0, 2 * Math.PI);

            var R = this.red;
            var G = this.green;
            var B = this.blue;
            var A = this.alpha * this.waveFunction(this.frameCount);

            this.currentAlpha = A * this.radius * this.RADIUS_MODIFIER;
            GLOBALS.ctx.fillStyle = 'rgba(' + R + ', ' + G + ', ' + B + ', ' + A + ')';
            GLOBALS.ctx.fill();
            GLOBALS.ctx.closePath();
        }
    }, {
        key: 'waveFunction',
        value: function waveFunction(position) {
            var howFarInPeriod = position / this.GLOW_PERIOD;
            var modifier = 8;

            return (Math.sin(2 * Math.PI * howFarInPeriod) + 1) / modifier;
        }
    }]);

    return WaveComponent;
}();

var AudioSignal = function () {
    function AudioSignal(_ref2) {
        var x = _ref2.x,
            y = _ref2.y;

        _classCallCheck(this, AudioSignal);

        this.MIN_FREQ = 20;
        this.MAX_FREQ = 15000;
        this.GAIN_MODIFIER = 0.0005;
        var maxMultiplier = Math.log2(this.MAX_FREQ / this.MIN_FREQ);

        var position = (window.innerHeight - y) / window.innerHeight;

        var pan = 2 * ((GLOBALS.width - x) / GLOBALS.width) - 1;
        this.panner = GLOBALS.audioCtx.createStereoPanner();
        this.panner.pan.value = -pan;

        this.gainNode = GLOBALS.audioCtx.createGain();

        this.oscillator = GLOBALS.audioCtx.createOscillator();
        this.oscillator.type = 'sine';
        this.freq = this.MIN_FREQ * Math.pow(2, position * maxMultiplier);
        this.oscillator.frequency.value = this.freq;
        this.oscillator.connect(this.gainNode);

        this.gainNode.connect(this.panner);
        this.gainNode.gain.value = 0;

        this.panner.connect(GLOBALS.filter);

        this.oscillator.start();
    }

    _createClass(AudioSignal, [{
        key: 'changeGain',
        value: function changeGain(newValue) {
            this.gainNode.gain.value = this.GAIN_MODIFIER * newValue;
        }
    }]);

    return AudioSignal;
}();

var WaveGenerator = function () {
    function WaveGenerator() {
        _classCallCheck(this, WaveGenerator);
    }

    _createClass(WaveGenerator, null, [{
        key: 'createSpotifyWavesSet',
        value: function createSpotifyWavesSet() {
            var spotifyColor = { red: 30, green: 215, blue: 96 };
            GLOBALS.waves.push(this.createRandomWave({
                x: GLOBALS.width,
                y: GLOBALS.height / 3,
                color: spotifyColor,
                speed: 1,
                alphaStep: 1 / 300,
                isSilent: true
            }));

            GLOBALS.waves.push(this.createRandomWave({
                x: 30,
                y: GLOBALS.height - 40,
                color: spotifyColor,
                speed: 1.2,
                alphaStep: 1 / 400,
                isSilent: true
            }));
        }
    }, {
        key: 'createRandomWave',
        value: function createRandomWave(_ref3) {
            var x = _ref3.x,
                y = _ref3.y,
                color = _ref3.color,
                speed = _ref3.speed,
                alphaStep = _ref3.alphaStep,
                isSilent = _ref3.isSilent;

            var finalColor = color || this.generateRandomColor();

            var waveSettings = Object.assign({}, {
                speed: this.isDef(speed) ? speed : Math.random() * 0.8 + 0.2,
                alphaStep: this.isDef(alphaStep) ? alphaStep : (Math.random() * 0.5 + 0.5) / 200,
                duration: 400 + Math.random() * 150,
                x: this.isDef(x) ? x : Math.round(Math.random() * GLOBALS.width),
                y: this.isDef(y) ? y : Math.round(Math.random() * GLOBALS.height),
                isSilent: isSilent
            }, finalColor);

            return new Wave(waveSettings);
        }
    }, {
        key: 'isDef',
        value: function isDef(value) {
            return typeof value !== 'undefined';
        }
    }, {
        key: 'generateRandomColor',
        value: function generateRandomColor() {
            var color = void 0;
            do {
                color = {
                    red: this.randomColor(),
                    green: this.randomColor(),
                    blue: this.randomColor()
                };
            } while (color.red + color.green + color.blue < 160);

            return color;
        }
    }, {
        key: 'randomColor',
        value: function randomColor() {
            var min = 10;
            return Math.round(min + Math.random() * (127 - min));
        }
    }]);

    return WaveGenerator;
}();

var AnimationRunner = function () {
    function AnimationRunner(GLOBALS) {
        _classCallCheck(this, AnimationRunner);

        this.lastFrameTime = Date.now();
        this.GLOBALS = GLOBALS;

        var framerate = 25;
        this.msPerFrame = 1000 / framerate;
    }

    _createClass(AnimationRunner, [{
        key: 'startAnimation',
        value: function startAnimation() {
            this.processFrame();
        }
    }, {
        key: 'processFrame',
        value: function processFrame() {
            var currentTime = Date.now();

            if (currentTime - this.lastFrameTime > this.msPerFrame) {
                window.requestAnimationFrame(this.drawFrame.bind(this));
                this.lastFrameTime = currentTime;
            } else window.requestAnimationFrame(this.processFrame.bind(this));
        }
    }, {
        key: 'drawFrame',
        value: function drawFrame() {
            var alphaFactor = 0.7;
            this.GLOBALS.ctx.fillStyle = 'rgba(0, 0, 0, ' + alphaFactor + ')';
            this.GLOBALS.ctx.fillRect(0, 0, this.GLOBALS.width, this.GLOBALS.height);
            this.GLOBALS.waves.forEach(function (wave) {
                wave.spreadStep();
            });

            this.GLOBALS.waves = this.GLOBALS.waves.filter(function (wave) {
                return !wave.defunct;
            });

            window.requestAnimationFrame(this.processFrame.bind(this));
        }
    }]);

    return AnimationRunner;
}();

var Page = function () {
    function Page() {
        _classCallCheck(this, Page);
    }

    _createClass(Page, null, [{
        key: 'setupDimensionsAndCanvas',
        value: function setupDimensionsAndCanvas() {
            GLOBALS.height = this.getHeight();
            GLOBALS.width = document.body.clientWidth;

            GLOBALS.canvas.width = GLOBALS.width;
            GLOBALS.canvas.height = GLOBALS.height;
        }
    }, {
        key: 'getHeight',
        value: function getHeight() {
            var body = document.body;
            var html = document.documentElement;

            return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
        }
    }, {
        key: 'setupBackgroundLinkListener',
        value: function setupBackgroundLinkListener() {
            var _this3 = this;

            var backgroundLink = document.getElementById('show-background-link');
            backgroundLink.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                document.body.classList.add('hide-main-text');
                _this3.fadeOutBackgroundWaves();
                _this3.addCanvasListener();
                window.addEventListener('resize', _this3.setupDimensionsAndCanvas.bind(_this3));
                GLOBALS.offset = window.pageYOffset;
            });
        }
    }, {
        key: 'fadeOutBackgroundWaves',
        value: function fadeOutBackgroundWaves() {
            GLOBALS.waves.forEach(function (wave) {
                wave.phaseOut = true;
            });
        }
    }, {
        key: 'addCanvasListener',
        value: function addCanvasListener() {
            var _this4 = this;

            document.body.addEventListener('click', function (e) {
                document.getElementById('empty-state-text').classList.add('hide');
                var coordinates = _this4.getMousePos(e);
                GLOBALS.waves.push(WaveGenerator.createRandomWave(coordinates));
            });
        }
    }, {
        key: 'getMousePos',
        value: function getMousePos(evt) {
            return {
                x: evt.pageX - window.pageXOffset,
                y: evt.pageY - window.pageYOffset
            };
        }
    }]);

    return Page;
}();

var GLOBALS = {};

window.onload = function () {
    GLOBALS = {
        offset: 0,
        height: 0,
        width: 0,
        canvas: document.getElementById('background'),
        audioCtx: new (window.AudioContext || window.webkitAudioContext)(),
        waves: []
    };

    GLOBALS.ctx = GLOBALS.canvas.getContext('2d');

    GLOBALS.masterGain = GLOBALS.audioCtx.createGain();
    GLOBALS.masterGain.gain.value = 80;
    GLOBALS.masterGain.connect(GLOBALS.audioCtx.destination);

    GLOBALS.filter = GLOBALS.audioCtx.createBiquadFilter();
    GLOBALS.filter.type = 'highshelf';
    GLOBALS.filter.frequency.value = 7000;
    GLOBALS.filter.gain.value = -50;
    GLOBALS.filter.connect(GLOBALS.masterGain);

    Page.setupBackgroundLinkListener();
    Page.setupDimensionsAndCanvas();

    WaveGenerator.createSpotifyWavesSet();

    var runner = new AnimationRunner(GLOBALS);
    runner.startAnimation();
};

}());
