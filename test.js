const test = require('tape')

test.only('scale function', (t) => {
    const scale = require('./lane-generator').scale

    //t.equal(scale(0.1, [[0, 1]]), 0.1, 'works on single ranges')
    //t.equal(scale(1, [[0, 2]]), 2, 'works on single ranges')
    //t.equal(scale(0.6, [[0, 2]]), 1.2, 'works on single ranges')

    //t.equal(scale(0.5, [[0, 10], [20, 30]]), 20, 'middle point is well defined')

    t.equal(scale(0.75, [[0, 10], [20, 30], [40, 60]]), 50, 'works for multiple ranges')

    t.end()
})

test('whichPointInRange function', (t) => {
    const whichPointInRange = require('./lane-generator').whichPointInRange

    t.equal(whichPointInRange(0, [0, 1]), 0)
    t.equal(whichPointInRange(1, [1, 2]), 0)
    t.equal(whichPointInRange(2, [1, 2]), 1)
    t.equal(whichPointInRange(7.5, [5, 10]), 0.5)

    t.end()
})

test('generateRanges function', (t) => {
    const generateRanges = require('./lane-generator').generateRanges

    const rect1 = {
        top: 25,
        left: 25,
        bottom: 75,
        right: 75,
    }

    const rect2 = {
        top: 10,
        left: 10,
        bottom: 20,
        right: 40,
    }

    const rect3 = {
        top: 80,
        left: 25,
        bottom: 90,
        right: 75,
    }

    const rect4 = {
        top: 0,
        left: 20,
        bottom: 20,
        right: 30,
    }

    const rect5 = {
        top: 0,
        left: 20,
        bottom: 100,
        right: 30,
    }

    const boundaries = [0, 100]

    t.deepEqual(generateRanges(50, [rect1], boundaries), [[0, 25], [75, 100]], 'range is correct')
    t.deepEqual(generateRanges(0, [rect1], boundaries), [[0, 100]], 'range is full when no intersection')
    t.deepEqual(generateRanges(30, [rect1, rect2], boundaries), [[0, 10], [20, 25], [75, 100]], 'multiple rectangles are handled properly')
    t.deepEqual(generateRanges(30, [rect1, rect2], boundaries, 15), [[75, 100]], 'small gaps can be ignored')
    t.deepEqual(generateRanges(30, [rect1, rect3], boundaries, 10), [[0, 25], [90, 100]], 'small gaps can be ignored and ranges are merged')
    t.deepEqual(generateRanges(30, [rect1, rect3], boundaries, 10), [[0, 25], [90, 100]], 'small gaps can be ignored and ranges are merged')
    t.deepEqual(generateRanges(30, [rect4], boundaries, 10), [[20, 100]], 'rectangles can start at point 0')
    t.deepEqual(generateRanges(30, [rect5], boundaries, 10), [[100, 100]], 'range is empty if no room')


    t.end()
})
