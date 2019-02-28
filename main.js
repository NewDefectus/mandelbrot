﻿var mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
var canvas = document.getElementById("canvas");
var canvasContainer = document.getElementById("canvasContainer");
var overlayCanvas = document.getElementById("overlayCanvas");
var body = document.getElementById("body");

document.documentElement.style.setProperty("--topBarOffset", "calc(0 * var(--base))");

var boundingLeft = 0, boundingTop = 0;

window.addEventListener("resize", updateView);
updateView();

var transScale

function updateView() {
    transScale = Math.max(window.innerWidth, window.innerHeight) / canvas.width * 1.0001;
    canvasContainer.style.transform = "scale(" + transScale + ", " + transScale + ")";
    let rect = canvas.getBoundingClientRect();
    boundingLeft = rect.left;
    boundingTop = rect.top;
    if (Math.min(window.innerWidth, window.innerHeight) > 500)
        document.documentElement.style.setProperty("--base", Math.min(window.innerWidth, window.innerHeight) / 1000 + "px");
    else
        document.documentElement.style.setProperty("--base", Math.min(window.innerWidth, window.innerHeight) / 500 + "px");
}






var res = document.getElementById("res");
var resHint = document.getElementById("resolutionHint");
var iters = document.getElementById("iters");
var posRe = document.getElementById("posRe");
var posIm = document.getElementById("posIm");
var posFull = document.getElementById("coordinates");
var posFullContainer = document.getElementById("coordinatesContainer");
var continuousCheckbox = document.getElementById("continuousCheckbox");

var pathOpener = document.getElementById("pathOpener");
var pathDescription = document.getElementById("pathDescription");
var settings = document.getElementById("settings");
var paletteSettings = document.getElementById("paletteSettings");

var pathCloser = document.getElementById("pathCloser");
var settingsOpener = document.getElementById("settingsOpener");

var pathOpenerAnimation = new animation(function (x) { pathOpener.style.top = "calc(" + (x * 125 - 150) + " * var(--base))" }, 0.3);
var pathDescriptionAnimation = new animation(function (x) {
    pathDescription.style.height = 100 * x + "%";
    if (x == 0) {
        pathContainer.style.height = 0;
        pathCloser.style.display = "none";
        posFull.style.boxShadow = "";
    }
}, 0.3);
var barAnimation = new animation(function (x) {
    document.documentElement.style.setProperty("--topBarOffset", "calc(" + 65 * x + " * var(--base))");
    settingsOpener.style.top = "calc(" + (-75 + 65 * x) + " * var(--base))";
    if (x > 0.8) {
        pathCloser.style.display = "";
    }
 //   if (x > 0.1)
 //       settingsAnimation.open();
}, 0.5);

var settingsAnimation = new animation(function (x) {
    document.documentElement.style.setProperty("--topBarOffset", "calc(" + (65 + 240 * x) + " * var(--base))");
    //topBar.style.top = "calc(" + (240 * (x - 1)) + " * var(--base))";
    //pathContainer.style.maxHeight = (mobile) ? "calc(100vh - " + topBar.style.top + " - 56px)" : "calc(100vh - " + topBar.style.top + ")";
    //pathIterations.style.maxHeight = (mobile) ? "calc(100vh - " + topBar.style.top + " - 100 * var(--base) - 56px)" : "calc(100vh - " + topBar.style.top + " - 100 * var(--base))";
}, 0.4);

var pointRadius = 8;
pointLockAnimation = new animation(function (x) { pointRadius = x * 3 + 5; movePoint() }, 0.2);
pointLockAnimation.frame = 1;
var mainPathDiv = document.getElementById("mainPathDiv");
var pathConclusion = document.getElementById("pathConclusion");
var pathIterations = document.getElementById("pathIterations");
var displayPathToggler = document.getElementById("displayPathToggler");
var pathContainer = document.getElementById("path");
var topBar = document.getElementById("topBar");
pathContainer.style.maxHeight = (mobile) ? "calc(100vh - var(--topBarOffset) - 56px)" : "calc(100vh - var(--topBarOffset))";
pathIterations.style.maxHeight = "calc(100% - 107 * var(--base))";
var pathContainerHeight = "";
displayPathToggler.addEventListener("click", function () {
    parameters.showPaths = !parameters.showPaths;

    if (parameters.showPaths && !confirmedWarning && parameters.iters > 30) {
        confirmedWarning = window.confirm("WARNING: Paths longer than 30 iterations contain strong colors that, if moved about too quickly, may potentially trigger seizures for people with photosensitive epilepsy.\n\nView paths anyway?");
        if (!confirmedWarning)
            parameters.showPaths = false;
    }

    this.innerText = (parameters.showPaths) ? "Hide path" : "Show path";
    markPoint();
    updateParameters();
});

function openPath()
{
    pathCloser.style.pointerEvents = "all";
    pathIterations.scrollTop = 0;
    pathContainer.style.height = pathContainerHeight;
    pathDescriptionAnimation.open();
    pathCloser.style.display = "";
}

function closePath() {
    pathDescriptionAnimation.close();
    pathCloser.style.pointerEvents = "none";
}


function openSettings() {

    settingsAnimation.open();
}


var movePointEnabled = !mobile;


var point = [0, 0];
var screenPoint = [0, 0];
var oldCoords = [];

var startWithPoint = false;

function getPreset() {
    let settings = (new URL(window.location.href)).searchParams;

    let setCoords = (settings.get("coords") || "0").split(/(-*\d.*i*(?=-| ))/);
    let setScale = parseFloat(settings.get("scale") || 2);
    let setRes = parseInt(settings.get("res") || 100);
    let setIters = parseInt(settings.get("iters") || 16);
    let setContinuous = settings.has("continuous");
    let showPaths = settings.has("path");

    let setCoordX = 0; let setCoordY = 0;

    for (let i of setCoords) {
        if (i.includes('i'))
            if (i == 'i' || i == " i")
                setCoordY++;
            else if (i == "-i" || i == " -i")
                setCoordY--;
            else
                setCoordY += parseFloat(i);
        else
            if (i) setCoordX += parseFloat(i);
    }

    res.value = setRes;
    iters.value = setIters;
    continuousCheckbox.checked = setContinuous;
    posRe.value = ((setCoordX >= 0) ? ' ' : '') + setCoordX.toFixed(17);
    posIm.value = ((setCoordY >= 0) ? '+' : '') + setCoordY.toFixed(17);
    point = [setCoordX, setCoordY];

    oldCoords = [setCoordX, setCoordY, setScale];

    drawPalettes(setContinuous);


    return { x: setCoordX, y: setCoordY, scale: setScale, res: setRes, iters: setIters, continuous: setContinuous, showPaths: showPaths };

}

var parameters = getPreset();

var confirmedWarning = false;

body.addEventListener("keydown", function () { if (event.keyCode == 13) { parameters.res = res.value; parameters.iters = iters.value; iterations = Number(parameters.iters); drawMandelbrot(); generatePath() } });

function updateRes() {
    let v = Number(res.value);
    let r = "";

    if (v < 30)
        r = "Very low";
    else if (v < 80)
        r = "Low";
    else if (v < 160)
        r = "Default";
    else if(v < 350)
        r = "Medium";
    else if (v < 700)
        r = "High";
    else
        r = "Very high";
    resHint.innerText = r;
}
updateRes();
res.addEventListener("input", updateRes);
res.addEventListener("change", function () { parameters.res = this.value || 100; drawMandelbrot() });
iters.addEventListener("blur", function () { parameters.iters = this.value || 6; iterations = Number(parameters.iters); drawMandelbrot(); generatePath() });

continuousCheckbox.addEventListener("input", function () { parameters.continuous = this.checked; drawPalettes(parameters.continuous); generatePath(); drawMandelbrot() });

function fixNumber(string, plusSign)
{
    let re = new RegExp("(?![\\d|\\-|" + plusSign + "|.]).", "g");
    let newValue = string.replace(re, '0');
    let matches = [];

    
    if (!newValue.includes('.')) {
        matches = newValue.match(/\d/);
        let allSecondDigit = 0;
        if (matches)
        {
            allSecondDigit = newValue.indexOf(matches[0]) + 1;
            newValue = newValue.slice(0, allSecondDigit) + '.' + newValue.slice(allSecondDigit);
        }
        else
            return plusSign + '0.' + '0' * 17;
    }

    let preDot = newValue.slice(0, newValue.indexOf('.'));
    let postDot = newValue.slice(newValue.indexOf('.'));

    re = new RegExp("[-|" + plusSign + "]");
    matches = preDot.match(re);
    let sign = (matches) ? matches[0] : plusSign;

    matches = preDot.match(/\d/g);
    let firstDigit = (matches) ? matches[0] : '0';

    let decimals = (postDot.replace(/(?!\d)./g, '') + '0'.repeat(17)).slice(0, 17);


    newValue = sign + firstDigit + '.' + decimals;
    return newValue;
}
posRe.addEventListener("input", function ()
{
    let start = this.selectionStart, end = this.selectionEnd;
    this.value = fixNumber(this.value, ' ');
    this.setSelectionRange(start, end);
    point[0] = Number(this.value) || 0;
    screenPoint[0] = toScreenCoords(Number(this.value) || 0, 0)[0];
    markPoint();
    generatePath();
}
);
posIm.addEventListener("input", function ()
{
    let start = this.selectionStart, end = this.selectionEnd;
    this.value = fixNumber(this.value, '+');
    this.setSelectionRange(start, end);
    point[1] = Number(this.value) || 0;
    screenPoint[1] = toScreenCoords(0, Number(this.value) || 0)[1];
    markPoint();
    generatePath();
}
);

function updatePoint(x, y) {
    posRe.value = ((x >= 0) ? ' ' : '') + x.toFixed(17);
    posIm.value = ((y >= 0) ? '+' : '') + y.toFixed(17);
    point = [x, y];
    screenPoint = toScreenCoords(x, y);
}

function complexNumToString(re, im, forPath = false) {
    if (forPath) {
        re = Math.round(re * 10000) / 10000;
        im = Math.round(im * 10000) / 10000;

        return (((re == 0) ? "" : re) +
            (
                (im == 0) ? "" : (
                    (im < 0) ? (
                        (im == -1) ? "-i" : im + "i"
                    ) : (
                            ((re == 0) ? "" : "+") + ((im == 1) ? "i" : im + "i")
                        )
                )
            )).replace(/\-/g, "&minus;");
    }
    else {
        return ((re == 0) ? "" : re) +
            (
                (im == 0) ? "" : (
                    (im < 0) ? (
                        (im == -1) ? "-i" : im + "i"
                    ) : (
                            ((re == 0) ? "" : "+") + ((im == 1) ? "i" : im + "i")
                        )
                )
            )
    }
}

function updateParameters() {
    iters.value = parameters.iters;
    iterations = Number(parameters.iters);
    res.value = parameters.res;
    continuousCheckbox.checked = parameters.continuous;

    if (oldCoords[0] != parameters.x || oldCoords[1] != parameters.y || oldCoords[2] != parameters.scale)
    {
        if (movePointEnabled) {
            let newPoint = toCanvasCoords(screenPoint[0], screenPoint[1]);
            updatePoint(newPoint[0], newPoint[1]);
        }
        else
            updatePoint(point[0], point[1]);
        
        markPoint();
        generatePath();
    }
    oldCoords = [parameters.x, parameters.y, parameters.scale];

    if (parameters.showPaths && !confirmedWarning && parameters.iters > 30) {
        parameters.showPaths = false;
    }
        


    // Here we put all the custom parameters straight into the URL for easy access. It's also a great failsafe if you accidentally close the page.
    let historyString = "?"
        + ((parameters.res == 100) ? "" : "res=" + parameters.res + '&')
        + ((parameters.iters == 16) ? "" : "iters=" + parameters.iters + '&')
        + ((parameters.x == 0 && parameters.y == 0) ? "" : "coords=" + complexNumToString(parameters.x, parameters.y) + '&'
        )
        + ((parameters.scale == 2) ? "" : "scale=" + parameters.scale + '&')
        + ((parameters.continuous) ? "continuous&" : "")
        + ((parameters.showPaths) ? "path" : "");
    if (historyString[historyString.length - 1] == '&')
        historyString = historyString.slice(0, -1);
    window.history.replaceState({ "pageTitle": "Mandelbrot Set" }, "", historyString);

}


var xMin, xMax, yMin, yMax, width, height = 0;
var touchStill = null;

if (mobile) {
    overlayCanvas.addEventListener("touchstart", startTouch);
    overlayCanvas.addEventListener("touchend", endTouch);
    overlayCanvas.addEventListener("touchmove", moveCursor);
}
else {
    overlayCanvas.addEventListener("click", shiftCoords);
    overlayCanvas.addEventListener("wheel", shiftScale);
    overlayCanvas.addEventListener("mousemove", moveCursor);
    overlayCanvas.addEventListener("contextmenu", togglePointLock);
}

function toScreenCoords(x, y) {
    return [(x - parameters.x + width / 2) * canvasSize, (-y + parameters.y + height / 2) * canvasSize];
}

function toCanvasCoords(x, y) {
    return [x / canvasSize + parameters.x - width / 2, -y / canvasSize + parameters.y + height / 2];
}

function iterateFPath(x, y) {
    let A = 0, a = 0, b = 0, i = 0;
    let path = [{ x: 0, y: 0 }];
    let keepIterating = true;
    while (i++ < Number(iterations) + 1 && keepIterating) {
        keepIterating = (a * a + b * b <= 4);
        a = a * a - b * b + x;
        b = 2 * A * b + y;
        path.push({ x: a, y: b });
        A = a;
    }
    return path;
}

var cursorPosition = [parameters.x, parameters.y];
var touchDistance = null;


Touch.prototype.canvasCoords = function () {
    return toCanvasCoords(this.clientX / transScale - boundingLeft, this.clientY / transScale - boundingTop);
}

function moveCursor(e) {
    if (!mobile)
        cursorPosition = [
            parameters.x + e.offsetX / canvasSize - width / 2,
            parameters.y - e.offsetY / canvasSize + height / 2
        ];
    else {
        let touches = e.touches;
        if (touches.length > 1) {
            let tempTouchDistance = Math.sqrt((touches[0].clientX - touches[1].clientX) ** 2 + (touches[0].clientY - touches[1].clientY) ** 2);
            let centerPoint = toCanvasCoords((touches[0].clientX + touches[1].clientX) / 2 / transScale - boundingLeft, (touches[0].clientY + touches[1].clientY) / 2 / transScale - boundingTop);

            if (touchDistance) {
                if (tempTouchDistance > touchDistance + 40)
                    shiftScale([centerPoint[0], centerPoint[1], -1, tempTouchDistance]);
                if (tempTouchDistance < touchDistance - 40)
                    shiftScale([centerPoint[0], centerPoint[1], 1, tempTouchDistance]);
            }
            else
                touchDistance = tempTouchDistance
        }
        else {
            cursorPosition = touches[0].canvasCoords();
            if (!touchStill) {
                movePointEnabled = true;
                pointLockAnimation.open();
                pathOpenerAnimation.close();
                closePath();
            }
        }

        touchStill = null;
    }
        
    if (movePointEnabled)
        movePoint();
}


var barBackground = document.getElementById("barBackground");

function colorBar() {
    let iter = (parameters.continuous) ? iterateFSmooth(point[0], point[1]) : iterateF(point[0], point[1]);
    topBar.style.backgroundColor = barBackground.style.backgroundColor = (iter <= iterations) ? getColor(iter) : "#000000";
}


function movePoint() {
    let x = cursorPosition[0] - point[0];
    let y = cursorPosition[1] - point[1];
    let multiplier = (movePointEnabled) ? pointLockAnimation.frame : 0;
    updatePoint(point[0] + x * multiplier, point[1] + y * multiplier);

    colorBar();
    if (barAnimation.frame == 0)
        barAnimation.open();
    markPoint();
}

function markPoint()
{
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    if (parameters.showPaths)
        showPath();
    overlayCtx.beginPath();
    overlayCtx.arc(screenPoint[0], screenPoint[1], pointRadius, 0, 2 * Math.PI, false);
    overlayCtx.fillStyle = "white";
    overlayCtx.fill();
    overlayCtx.strokeStyle = "black";
    overlayCtx.lineWidth = 2;
    overlayCtx.stroke();
}





function togglePointLock(e) {
    if (e.button == 2) {
        e.preventDefault();
        movePointEnabled = !movePointEnabled;
        overlayCanvas.style.cursor = (movePointEnabled) ? "none" : "default";
        if (!movePointEnabled)
        {
            generatePath();
            pointLockAnimation.close();
            pathOpenerAnimation.open();
        }    
        else
        {
            pointLockAnimation.open();
            pathOpenerAnimation.close();
            closePath();
        }
            
    }
}


function startTouch(e) {
    touchDistance = null;
    touchStill = e.touches[0];
}

function endTouch(e) {
    if (touchStill)
        shiftCoords(touchStill);
    else {
        movePointEnabled = false;
        generatePath();
        pointLockAnimation.close();
        pathOpenerAnimation.open();
    }
}



function generatePath()
{
    let path = iterateFPath(point[0], point[1]);
    let lastPoint = path[path.length - 2];
    let lastEscaped = (lastPoint.x ** 2 + lastPoint.y ** 2 > 4);

    colorBar();

    pathContainerHeight = "calc(" + (107 + 104 * (path.length - 2)) + " * var(--base)";
    if (pathDescriptionAnimation.frame > 0)
        pathContainer.style.height = pathContainerHeight;

    mainPathDiv.style.backgroundColor = getColor((parameters.continuous) ? iterateFSmooth(point[0], point[1]) : iterateF(point[0], point[1]));
    pathConclusion.innerHTML =
        (lastEscaped) ?
            ("escapes after<br />" + (path.length - 2) + " iteration" + ((path.length - 2 > 1) ? 's.' : '.'))
        :
            ("is in the Mandelbrot set.");

    displayPathToggler.innerText = (parameters.showPaths) ? "Hide path" : "Show path";

    mainPathDiv.append(displayPathToggler);


    let prevPoints = pathIterations.children;
    while (prevPoints.length > 0)
        pathIterations.removeChild(prevPoints[0]);
    
    for (i = 1; i < path.length - 1; i++) {
        let pointDiv = document.createElement("div");
        pointDiv.className = "pathPoint";
        if (parameters.continuous)
            pointDiv.style.backgroundImage = "linear-gradient(" + getPathColor(i, { x: 0, y: 0 }, { x: 0, y: 0 }, [point[0], point[1], false]);
        else
            pointDiv.style.backgroundColor = getPathColor(i, { x: 0, y: 0 }, { x: 0, y: 0 });


        let iterNumber = document.createElement("div");
        iterNumber.className = "pathIter";
        iterNumber.innerHTML = '#' + i + "<br /><br />";
        pointDiv.appendChild(iterNumber);

        let equation = document.createElement("div");
        let prevPoint = path[i - 1];
        equation.className = "pathEquation";
        equation.innerHTML =
            '(' + (complexNumToString(prevPoint.x, prevPoint.y, true) || '0') + ")<sup>2</sup> + ("
            + (complexNumToString(point[0], point[1], true) || '0') + ") =<br /><br />";
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







function getPathColor(iteration, prevCoords, currCoords, origCoords = [])
{
    prevCoords = toScreenCoords(prevCoords.x, prevCoords.y);
    currCoords = toScreenCoords(currCoords.x, currCoords.y);
    if (parameters.continuous) {
        if (origCoords.length == 0) {
            let gradient = ctx.createLinearGradient(prevCoords[0], prevCoords[1], currCoords[0], currCoords[1]);
            gradient.addColorStop(0, getColor(iteration));
            gradient.addColorStop(1, getColor(iteration + 1));
            return gradient;
        }
        else {
            if (origCoords[2]) {
                iteration = iterateFSmooth(origCoords[0], origCoords[1]);
                getColor(iteration);
            }
            else
                return getColor(iteration) + ", " + getColor(iteration + 1)
        }
    }
    else
        return getColor(iteration);
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
        if (i == path.length - 1)
        {
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
    if (lastCoords.x ** 2 + lastCoords.y ** 2 > 4) {
        let m = ((path[path.length - 3] || { y: 0 }).y - lastCoords.y) / ((path[path.length - 3] || { x: 0 }).x - lastCoords.x);
        let a = m * lastCoords.x - lastCoords.y;
        let b = 1 + m ** 2;
        if ((path[path.length - 3] || { x: 0 }).x - lastCoords.x < 0) {
            lastCoords.x = (m * a + Math.sqrt(4 * b - a ** 2)) / b;
            lastCoords.y = (m * Math.sqrt(4 * b - a ** 2) - a) / b;
        }
        else {
            lastCoords.x = (m * a - Math.sqrt(4 * b - a ** 2)) / b;
            lastCoords.y = (-m * Math.sqrt(4 * b - a ** 2) - a) / b;
        }


        let screenCoords = toScreenCoords(lastCoords.x, lastCoords.y);
        overlayCtx.beginPath();
        overlayCtx.arc(screenCoords[0], screenCoords[1], 6, 0, 2 * Math.PI, false);
        overlayCtx.fillStyle = "red";
        overlayCtx.fill();

        overlayCtx.beginPath();
        screenCoords = toScreenCoords(0, 0);
        overlayCtx.arc(screenCoords[0], screenCoords[1], 2 * canvasSize, 0, 2 * Math.PI, false);
        overlayCtx.strokeStyle = "red";
        overlayCtx.setLineDash([10]);
        overlayCtx.lineWidth = 2;
        overlayCtx.stroke();
        overlayCtx.setLineDash([0]);
    }

}

var ctx = canvas.getContext("2d");
var overlayCtx = overlayCanvas.getContext("2d");
var pointSize, pixelSize = 0;
var iterations = parameters.iters;
var canvasSize = canvas.width / width;
ctx.fillStyle = "black";


var log2 = 1 / Math.log(2);



function iterateF(x, y) // f(z)=z²+c, f(f(f(f(f(...f(0)))))...) < ∞
{
    let A = x, a = x, b = y, i = 0;
    while (i++ < iterations && a * a + b * b <= 4) {
        a = a * a - b * b + x;
        b = 2 * A * b + y;
        A = a;
    }
    return i;
}

function iterateFSmooth(x, y) {
    let A = x, a = x, b = y, i = 0;
    while (i++ < iterations && a * a + b * b < (1 << 16)) {
        a = a * a - b * b + x;
        b = 2 * A * b + y;
        A = a;
    }
    if (a * a + b * b <= 4)
        return -1;
    else
        return Math.max(i - Math.log(Math.log(a * a + b * b) / 2 * log2) * log2, 0.0001);
}

var oldPos = { x: 0, y: 0, scale: 2, res: 100 };
var limitReached = false;
var backupCanvas = document.createElement("canvas");
backupCanvas.width = canvas.width;
backupCanvas.height = canvas.height;
backupCtx = backupCanvas.getContext("2d");

function drawMandelbrot() {
    // Let's prepare the set's environment.
    pointSize = parameters.scale / parameters.res;

    let center = { x: parameters.x, y: -parameters.y };
    width = height = parameters.scale * 2;
    xMin = center.x - width / 2;
    xMax = center.x + width / 2;
    yMin = center.y - height / 2;
    yMax = center.y + height / 2;
    canvasSize = canvas.width / width;

    pixelSize = Math.ceil(pointSize * canvasSize);

    let oldX = null, oldY = null;

    limitReached = false;

    backupCtx.drawImage(canvas, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#000000";
    let x = xMin;

    // Now, let's draw it!
    for (; x < xMax; x += pointSize) {
        if (oldX == x || limitReached) {
            alert("Can't zoom any further.");
            break;
        }
        oldX = x;
        for (let y = yMin; y < yMax; y += pointSize) {
            if (oldY == y) {
                limitReached = true;
                break;
            }

            oldY = y;
            drawPixel(x, y, (parameters.continuous) ? iterateFSmooth(x, y) : iterateF(x, y));
        }
    }

    if (limitReached || oldX == x) {
        parameters.x = oldPos.x;
        parameters.y = oldPos.y;
        parameters.scale = oldPos.scale;
        parameters.res = oldPos.res;
        ctx.drawImage(backupCanvas, 0, 0);
    }

    updateParameters();
}




function drawPixel(x, y, iteration) {
    ctx.fillStyle = (iteration > iterations) ? "#000000" : getColor(iteration);
    ctx.fillRect(Math.round((x - xMin) * canvasSize), Math.round((y - yMin) * canvasSize), pixelSize, pixelSize);
}

function shiftCoords(e, multiplier = 1) {
    // This is for navigation around the complex plane.
    let x = 0, y = 0;
    if (mobile) {
        x = e.canvasCoords()[0] - parameters.x;
        y = e.canvasCoords()[1] - parameters.y;
    }
    else {
        x = e.offsetX / canvasSize - width / 2;
        y = (canvas.height - e.offsetY) / canvasSize - height / 2;
        e.preventDefault();
    }

    oldPos.x = parameters.x;
    oldPos.y = parameters.y;

    parameters.x += x * multiplier;
    parameters.y += y * multiplier;

    posRe.value = parameters.x;
    posIm.value = parameters.y;

    if (!limitReached)
        drawMandelbrot();
}

function shiftScale(e) {
    // And this is to zoom in on the complex plane, as well as move about it slightly.
    oldPos.scale = parameters.scale;
    parameters.scale *= 2 ** Math.sign((!mobile) ? e.deltaY : e[2]);

    if (!mobile)
        shiftCoords(e, 0.5);
    else {
        oldPos.x = parameters.x;
        oldPos.y = parameters.y;

        parameters.x += (e[0] - parameters.x) / 2;
        parameters.y += (e[1] - parameters.y) / 2;

        posRe.value = parameters.x;
        posIm.value = parameters.y;
        if (!limitReached)
            drawMandelbrot();
        touchDistance = e[3];
    }
}

drawMandelbrot();
if (parameters.x != 0 && parameters.y != 0) {
    generatePath();
    barAnimation.open();
    if (mobile) {
        pointLockAnimation.close();
        pathOpenerAnimation.open();
    }
}