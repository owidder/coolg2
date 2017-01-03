'use strict';

function beginMove(simulation, d) {
    var p = new SimplePromise();
    setTimeout(function () {
        simulation.alphaTarget(0.3).restart();
        if(d != null) {
            d.fx = d.x;
            d.fy = d.y;
        }
        setTimeout(function () {
            p.resolve();
        });
    });

    return p.promise;
}

function endMove(simulation, d) {
    var p = new SimplePromise();
    setTimeout(function () {
        simulation.alphaTarget(0);
        if(d != null) {
            d.fx = null;
            d.fy = null;
        }
        setTimeout(function () {
            p.resolve();
        });
    });

    return p.promise;
}

function moveTo(simulation, id, targetX, targetY, maxSteps, velocity, maxDuration) {
    var startMillis = (new Date()).getTime();
    var moveProm = new SimplePromise();

    function hypot(dx, dy) {
        return Math.sqrt(dx*dx + dy*dy);
    }

    function moveOne(d, stepX, stepY, stepDuration) {
        var prom = new SimplePromise();

        setTimeout(function() {
            d.fx += stepX;
            d.fy += stepY;
            prom.resolve();
        }, stepDuration);

        return prom.promise;
    }

    function moveRecursive(d, stepCtr) {
        function computeStepLength(target, current) {
            var length;
            if(Math.abs(target - current) < 10) {
                length = target - current;
            }
            else {
                length = (target - current) / 50;
            }

            return length;
        }

        function distanceToTarget() {
            return hypot(targetX - d.x, targetY - d.y);
        }

        var stepX = computeStepLength(targetX, d.x);
        var stepY = computeStepLength(targetY, d.y);
        var stepLength = hypot(stepX, stepY);
        var stepDuration = 1 / (velocity / stepLength);

        moveOne(d, stepX, stepY, stepDuration).then(function() {
            var millisSince = (new Date()).getTime() - startMillis;
            if(distanceToTarget() > stepLength && millisSince < maxDuration && stepCtr < maxSteps) {
                moveRecursive(d, stepCtr+1);
            }
            else {
                moveProm.resolve();
            }
        });
    }

    var data = d3.select("#" + id).data()[0];
    beginMove(simulation, data).then(function () {
        moveRecursive(data, 0);
        moveProm.promise.then(function () {
            endMove(simulation, data);
        });
    });

    return moveProm.promise;
}

function circlePoint(cx, cy, r, angle) {
    var x = cx + r * Math.cos(2 * Math.PI * angle / 360);
    var y = cy + r * Math.sin(2 * Math.PI * angle / 360);
    return {
        x: x,
        y: y
    };
}

function moveAllOnCircleRecursive(simulation, idsArray, cx, cy, r, currentAnglesArray, step) {
    var recursionEndedPromise = new SimplePromise();

    function moveAllRecursive(index) {
        var id = idsArray[index];
        currentAnglesArray[id] = isNaN(currentAnglesArray[id]) ? step : currentAnglesArray[id] + step;
        var pt = circlePoint(cx, cy, r, currentAnglesArray[id]);
        moveTo(simulation, id, pt.x, pt.y, 5, 1, 1000).then(function () {
            if(index+1 < idsArray.length) {
                moveAllRecursive(index+1);
            }
            else {
                recursionEndedPromise.resolve();
            }
        });
    }

    moveAllRecursive(0);
    recursionEndedPromise.promise.then(function () {
        moveAllOnCircleRecursive(simulation, idsArray, cx, cy, currentAnglesArray, step);
    });
}

function moveOnCircleRecursive(simulation, id, cx, cy, r, currentAngle, step, stopFlag) {
    var pt = circlePoint(cx, cy, r, currentAngle);
    moveTo(simulation, id, pt.x, pt.y, 5, 1, 1000).then(function() {
        if(!stopFlag.active) {
            moveOnCircleRecursive(simulation, id, cx, cy, r, currentAngle+step, step, stopFlag);
        }
    });
}

function moveOnCircle(simulation, id, cx, cy, r, startAngle, step) {
    var stopEvent = new SimpleEvent();
    var stopFlag = {
        active: false
    };
    stopEvent.on(function() {
        stopFlag.active = true;
    });
    moveOnCircleRecursive(simulation, id, cx, cy, r, startAngle, step, stopFlag);

    return stopEvent;
}