var canvas = document.getElementById("canvas");
var canvasContainer = document.getElementById("canvasContainer");
var overlayCanvas = document.getElementById("overlayCanvas");


var xMin, xMax, yMin, yMax, width, height = 0;

var mainFunction = function (a, b, x, y) { return [a**2-b**2+x, 2*a*b+y] };
var limitSquared = 4;

var log2 = 1 / Math.log(2);
var firstLog = 0.5 / Math.log(Math.sqrt(limitSquared));



function iterateF(x, y) // f(z)=z²+c, f(f(f(f(f(...f(0)))))...) < ∞
{
    let a = x, b = y, i = 0;
    while (i++ < iterations + (juliaSetCoords.length != 0) && a * a + b * b <= limitSquared)
        [a, b] = mainFunction(a, b, x, y);

    return i;
}

function iterateFSmooth(x, y) {
    let a = x, b = y, i = 0;
    while (i++ < iterations + (juliaSetCoords.length != 0) && a * a + b * b < (1 << 16))
        [a, b] = mainFunction(a, b, x, y);

    if (a * a + b * b <= limitSquared || !a || !b)
        return -1;
    else
        return Math.max(i - Math.log(Math.log(a * a + b * b) * firstLog) * log2, 0.0001);
}

function iterateFPath(x, y) {
    let a = 0, b = 0, i = 0;
    let path = [];
    if (!changedMainFunction && juliaSetCoords.length == 0)
        path = [{ x: 0, y: 0 }];
    else {
        a = x;
        b = y;
        path = [{ x: x, y: y }];
    }
    let keepIterating = true;
    while (i++ < Number(iterations) + 1 && keepIterating) {
        keepIterating = a * a + b * b <= limitSquared;
        [a, b] = mainFunction(a, b, x, y);
        path.push({ x: a, y: b });
    }

    return path;
}


function generatePath(colordiv = true) {
    let path = iterateFPath(point[0], point[1]);
    let lastPoint = path[path.length - 2];
    let lastEscaped = (lastPoint.x ** 2 + lastPoint.y ** 2 > limitSquared);

    pathContainerHeight = "calc(" + (107 + 104 * (path.length - 2)) + " * var(--base)";
    if (pathDescriptionAnimation.frame > 0)
        pathContainer.style.height = pathContainerHeight;

    let iteration = (parameters.continuous) ? iterateFSmooth(point[0], point[1]) : iterateF(point[0], point[1]);
    if (colordiv)
        mainPathDiv.style.backgroundColor = getColor(iteration);
    mainPathDiv.iteration = iteration;
    pathConclusion.innerHTML =
        (lastEscaped) ?
            (path.length > 2) ?
                ("escapes after<br />" + (path.length - 2) + " iteration" + ((path.length > 3) ? 's.' : '.'))
                :
                "is outside the limit (" + Math.sqrt(limitSquared) + ")."
            :
            (!changedMainFunction) ? ("is in " + ((juliaSetCoords.length == 0) ? "the Mandelbrot" : "this Julia") + " set.") : "does not escape.";

    displayPathToggler.innerText = (parameters.showPaths) ? "Hide path" : "Show path";

    mainPathDiv.append(displayPathToggler);


    let prevPoints = pathIterations.children;
    while (prevPoints.length > 0)
        pathIterations.removeChild(prevPoints[0]);

    for (i = 1; i < path.length - 1; i++) {
        let pointDiv = document.createElement("div");
        pointDiv.className = "pathPoint colored";
        pointDiv.iteration = i + (juliaSetCoords.length != 0);
        pointDiv.gradient = true;

        let colorsString = getPathColor(i, { x: 0, y: 0 }, { x: 0, y: 0 }, [point[0], point[1], false]);
        pointDiv.originColor = colorsString.split(", ");
        pointDiv.style.backgroundImage = "linear-gradient(" + colorsString;


        let iterNumber = document.createElement("div");
        iterNumber.className = "pathIter";
        iterNumber.innerHTML = '#' + i + "<br /><br />";
        pointDiv.appendChild(iterNumber);

        let equation = document.createElement("div");
        let prevPoint = path[i - 1];
        equation.className = "pathEquation";
        if (!changedMainFunction)
            equation.innerHTML =
                '(' + (complexNumToString(prevPoint.x, prevPoint.y, true) || '0') + ")<sup>2</sup> + ("
                + ((juliaSetCoords.length != 0) ? (complexNumToString(juliaSetCoords[0], juliaSetCoords[1], true)) : (complexNumToString(point[0], point[1], true)) || '0') + ") =<br /><br />";
        else
            equation.innerHTML = "<br /><br />";
        pointDiv.appendChild(equation);

        let result = document.createElement("div");
        let currPoint = path[i];
        result.className = "pathResult";
        if (i == path.length - 2) {
            pointDiv.style.borderBottom = "none";
            if (lastEscaped)
                result.style.color = "red";
        }

        result.innerHTML = complexNumToString(currPoint.x, currPoint.y, true) || '0';
        pointDiv.appendChild(result);

        pathIterations.appendChild(pointDiv);
    }
}


function showPath() {
    let path = iterateFPath(point[0], point[1]);
    let coords = screenPoint;
    overlayCtx.lineCap = "round";
    overlayCtx.lineWidth = 5;

    for (let i = 0; i < path.length; i++) {
        overlayCtx.strokeStyle = "black";
        overlayCtx.beginPath();
        overlayCtx.moveTo(coords[0], coords[1]);
        coords = toScreenCoords(path[i].x, path[i].y);
        overlayCtx.lineTo(coords[0], coords[1]);
        if (i == path.length - 1) {
            overlayCtx.setLineDash([15]);
            if (i > parameters.iters)
                overlayCtx.strokeStyle = "white";
        }

        overlayCtx.stroke();
    }

    overlayCtx.setLineDash([0]);

    overlayCtx.lineWidth = 4;
    coords = screenPoint;
    for (let i = 1; i < path.length; i++) {
        overlayCtx.beginPath();
        coords = toScreenCoords(path[i - 1].x, path[i - 1].y);
        overlayCtx.moveTo(coords[0], coords[1]);
        coords = toScreenCoords(path[i].x, path[i].y);
        overlayCtx.lineTo(coords[0], coords[1]);
        overlayCtx.strokeStyle = getPathColor(i, path[i - 1], path[i]);
        if (i == path.length - 1)
            overlayCtx.setLineDash([15]);
        overlayCtx.stroke();
    }

    overlayCtx.setLineDash([0]);

    let lastCoords = path[path.length - 2] || { x: 0, y: 0 };
    if (lastCoords.x ** 2 + lastCoords.y ** 2 > limitSquared && path.length > 2) {
        let m = ((path[path.length - 3] || { y: 0 }).y - lastCoords.y) / ((path[path.length - 3] || { x: 0 }).x - lastCoords.x);
        let a = m * lastCoords.x - lastCoords.y;
        let b = 1 + m ** 2;
        if ((path[path.length - 3] || { x: 0 }).x - lastCoords.x < 0) {
            lastCoords.x = (m * a + Math.sqrt(limitSquared * b - a ** 2)) / b;
            lastCoords.y = (m * Math.sqrt(limitSquared * b - a ** 2) - a) / b;
        }
        else {
            lastCoords.x = (m * a - Math.sqrt(limitSquared * b - a ** 2)) / b;
            lastCoords.y = (-m * Math.sqrt(limitSquared * b - a ** 2) - a) / b;
        }


        let screenCoords = toScreenCoords(0, 0);
        overlayCtx.beginPath();
        overlayCtx.arc(screenCoords[0], screenCoords[1], Math.sqrt(limitSquared) * canvasSize, 0, 2 * Math.PI, false);
        overlayCtx.setLineDash([10]);
        overlayCtx.lineWidth = 2;
        overlayCtx.strokeStyle = "red";
        overlayCtx.stroke();
        overlayCtx.setLineDash([0]);

        overlayCtx.beginPath();
        screenCoords = toScreenCoords(lastCoords.x, lastCoords.y);
        overlayCtx.arc(screenCoords[0], screenCoords[1], 8, 0, 2 * Math.PI, false);
        overlayCtx.fillStyle = getColor((parameters.continuous) ? iterateFSmooth(point[0], point[1]) : iterateF(point[0], point[1]));
        overlayCtx.fill();
    }

}

var ctx = canvas.getContext("2d");
var overlayCtx = overlayCanvas.getContext("2d");
var pointSize, pixelSize = 0;
var iterations = parameters.iters;
var canvasSize = canvas.width / width;
ctx.fillStyle = "black";

var oldPos = { x: parameters.x, y: parameters.y, scale: parameters.scale, res: parameters.res };
var limitReached = false;
var backupCanvas = document.createElement("canvas");
backupCanvas.width = canvas.width;
backupCanvas.height = canvas.height;
backupCanvas.style = "position: absolute; z-index: 0; left: 0px; top: 0px";
backupCtx = backupCanvas.getContext("2d");



var drawTimeouts = [];
var animateTimeouts = [];
var timeoutNumber = 0;
var fullTimeoutNumber = 0;

var transformation = { x: 0, y: 0, scale: 1 };



var intervalDelay = new Date().getTime();
var finishedMandelbrot = false;


var callbackLoops = [];


function nudgeCallbacks() {
    if (callbackLoops.length == 0 && finishedMandelbrot)
        runCallbacks();
}

function runCallbacks() {
    if (drawTimeouts.length > 0) {
        finishedMandelbrot = (drawTimeouts[0].t <= 2);
        drawTimeouts[0].f();
        drawTimeouts.shift();
    }

    if (callbackLoops.length > 0)
        callbackLoops.shift();

    if (animateTimeouts.length > 0 || navigatingWithKeyboard) {
        if (new Date().getTime() - intervalDelay >= 10) {
            for (let i = 0; i < animateTimeouts.length; i++)
                if (animateTimeouts[i]() == 0) {
                    animateTimeouts.splice(i, 1);
                    i--;
                }
            if (navigatingWithKeyboard)
                navWithKeyboard();
            intervalDelay = new Date().getTime();
        }
        if (finishedMandelbrot && callbackLoops.length == 0)
            callbackLoops.push(setTimeout(runCallbacks, 10));
    }
}





// Reasons:
// -1   None
// 0    Transformation
// 1    End of transformation
// 2    Parameter change

function drawMandelbrot(reason) {
    let transX = transformation.x + scalingShift[0] + keyboardShift[0];
    let transY = transformation.y + scalingShift[1] + keyboardShift[1];

    if (reason == 2)
        backupCtx.drawImage(canvas, 0, 0);

    // Halt the timeouts after the transformation has ended
    if (reason > 0) {
        prevFrame = 0;
        drawTimeouts = [];
        let scaleOffset = (canvas.width - canvas.width / transformation.scale) / 2;
        ctx.drawImage(backupCanvas, -transX * canvasSize + scaleOffset, transY * canvasSize + scaleOffset, canvas.width / transformation.scale, canvas.height / transformation.scale);
        transformation = { x: 0, y: 0, scale: 1 };
        scalingShift = [0, 0];
        keyboardShift = [0, 0];
        oldPos.x = parameters.x;
        oldPos.y = parameters.y;
        oldPos.scale = parameters.scale;
    }

    // Let's prepare the set's environment.
    if (reason == 0) {
        parameters.x = oldPos.x + transX;
        parameters.y = oldPos.y + transY;
        parameters.scale = oldPos.scale * transformation.scale;
        if (!movePointEnabled) {
            updatePoint(point[0], point[1]);
            markPoint();
        }

        pointSize = parameters.scale / 10;
        backupCanvas.style.transform = `
            translateX(${100 * (-0.5 - transX / parameters.scale / 2)}%)
            translateY(${100 * (-0.5 + transY / parameters.scale / 2)}%)
            scale(${1 / transformation.scale})
        `;
    }
    else {
        pointSize = parameters.scale * 2 / parameters.res;
    }
    let center = { x: parameters.x, y: parameters.y };
    width = height = parameters.scale * 2;
    xMin = center.x - width / 2;
    xMax = center.x + width / 2;
    yMin = center.y - height / 2;
    yMax = center.y + height / 2;
    canvasSize = canvas.width / width;

    let oldX = null, oldY = null;

    limitReached = false;

    pixelSize = Math.ceil(pointSize * canvasSize);

    ctx.fillStyle = "#000000";

    fullTimeoutNumber = timeoutNumber = width / pointSize;

    // Now, let's draw it!
    let inf = { xMin: xMin, yMax: yMax, canvasSize: canvasSize, pixelSize: pixelSize, shift: reason == 0 };

    for (let x = xMin; x < xMax; x += pointSize) {
        if (oldX == x || limitReached) {
            alert("Can't zoom any further.");
            limitReached = true;
            break;
        }
        oldX = x;

        if (reason != 0) {
            let pointS = pointSize;
            let t = timeoutNumber--;
            drawTimeouts.push({
                t: t, f: function () {
                    for (let y = yMin; y < yMax; y += pointS) {
                        if (oldY == y) {
                            limitReached = true;
                            break;
                        }
                        oldY = y;

                        drawPixel(x, y, (parameters.continuous) ? iterateFSmooth(x, y) : iterateF(x, y), inf);
                    }

                    if (reason == 2 || interpolatingColors) {
                        interpolateParameterChange((fullTimeoutNumber - t) / (fullTimeoutNumber - 1));
                        if (parameters.showPaths)
                            if (Math.abs(x - point[0]) <= pointS)
                                markPoint();
                    }

                    if (t == 1)
                        concludeMandelbrot();
                }
            });
            setTimeout(runCallbacks, 0);
        }
        else
            for (let y = yMin; y < yMax; y += pointSize) {
                if (oldY == y) {
                    limitReached = true;
                    break;
                }
                oldY = y;

                drawPixel(x, y, (parameters.continuous) ? iterateFSmooth(x, y) : iterateF(x, y), inf);
            }
    }
}

function concludeMandelbrot() {
    if (limitReached) {
        parameters.x = oldPos.x;
        parameters.y = oldPos.y;
        parameters.scale = oldPos.scale;
        parameters.res = oldPos.res;
        ctx.drawImage(backupCanvas, 0, 0);
    }

    updateParameters();
}




function drawPixel(x, y, iteration, inf) {
    ctx.fillStyle = backupCtx.fillStyle = (iteration > iterations + (juliaSetCoords.length != 0)) ? "#000000" : getColor(iteration);
    let arg0 = Math.round((x - inf.xMin) * inf.canvasSize);
    let arg1 = Math.round((-y + inf.yMax) * inf.canvasSize);

    if (!inf.shift && shiftMoved)
        backupCtx.fillRect(arg0, arg1, inf.pixelSize, inf.pixelSize);
    if (inf.shift || !shiftMoved)
        ctx.fillRect(arg0, arg1, inf.pixelSize, inf.pixelSize);
}

drawMandelbrot(-1);
if (parameters.x != 0 || parameters.y != 0) {
    colorBar();
    barAnimation.open();
    if(mobile)
        pathOpenerAnimation.open();
}

if (mobile) {
    pointLockAnimation.close();
}
