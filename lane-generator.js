function scale (x, ranges) {
    const sumOfRanges = ranges.reduce((sum, range) => sum += (range[1] - range[0]), 0)
    const scaledX = x * sumOfRanges

    const rangeNumberIsIn = whichRange(scaledX, ranges)
    const currentRange = ranges[rangeNumberIsIn]
    console.log(scaledX, sumOfRanges, currentRange);
    const rangeWidth = currentRange[1] - currentRange[0]
    const positionInRange = whichPointInRange(scaledX, currentRange)

    return positionInRange * rangeWidth + currentRange[0]
}

function whichRange (x, ranges) {
    let i = 0
    for (; i < ranges.length; i++)
        if (x <= ranges[i][1])
            break

    return i
}

function whichPointInRange (x, range) {
    return (x - range[0]) / (range[1] - range[0])
}

function generateRanges (x, currentRects, boundaries, minGap = 0) {
    const sortedRects = currentRects.slice().sort(compareRects)

    function compareRects (a, b) {
        return a.top - b.top
    }

    const breakPoints = [boundaries[0]]

    sortedRects.forEach((rectInTheWay) => {
        if (x >= rectInTheWay.left && x <= rectInTheWay.right) {
            const prevBreakpoint = breakPoints[breakPoints.length - 1]

            if (rectInTheWay.top - prevBreakpoint < minGap)
                breakPoints.splice(-1, 1)
            else
                breakPoints.push(rectInTheWay.top)

            breakPoints.push(rectInTheWay.bottom)
        }
    })

    breakPoints.push(boundaries[1])

    const ranges = []

    for (let i = 0; i < breakPoints.length; i += 2)
        ranges.push([breakPoints[i], breakPoints[i + 1]])

    return ranges
}

if (module)
    module.exports = {
        scale,
        generateRanges,
        whichPointInRange,
    }
