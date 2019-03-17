document.documentElement.style.setProperty("--topBarOffset", "calc(0 * var(--base))");

var boundingLeft = 0, boundingTop = 0;

window.addEventListener("resize", updateView);
updateView();

var transScale;

function updateView() {
    transScale = Math.max(window.innerWidth, window.innerHeight) / canvas.width * 1.0001;
    canvasContainer.style.transform = "scale(" + transScale + ")";
    let rect = canvas.getBoundingClientRect();
    boundingLeft = rect.left;
    boundingTop = rect.top;
    if (Math.min(window.innerWidth, window.innerHeight) > 500)
        document.documentElement.style.setProperty("--base", Math.min(window.innerWidth, window.innerHeight) / 1000 + "px");
    else
        document.documentElement.style.setProperty("--base", Math.min(window.innerWidth, window.innerHeight) / 500 + "px");

    if (pathContainer) {
        pathContainer.style.maxHeight = "calc(" + window.innerHeight + "px - var(--topBarOffset)";
        pathIterations.style.maxHeight = "calc(" + window.innerHeight + "px - var(--topBarOffset) - 107 * var(--base))";
    }
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
    pathDescription.style.height = "calc(" + x + " * " + pathContainer.clientHeight + "px)";
    if (x == 1)
        pathDescription.style.height = "100%";
    if (x == 0) {
        pathContainer.style.height = 0;
        pathCloser.style.display = "none";
        posFull.style.boxShadow = "";
        let prevPoints = pathIterations.children;
        while (prevPoints.length > 0)
            pathIterations.removeChild(prevPoints[0]);
    }
}, 0.3);
var barAnimation = new animation(function (x) {
    document.documentElement.style.setProperty("--topBarOffset", "calc(" + 65 * x + " * var(--base))");
    settingsOpener.style.top = "calc(" + (-75 + 65 * x) + " * var(--base))";
    if (x > 0.8) {
        pathCloser.style.display = "";
    }
}, 0.5);

var settingsAnimation = new animation(function (x) {
    document.documentElement.style.setProperty("--topBarOffset", "calc(" + (65 + 240 * x) + " * var(--base))");
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
pathContainer.style.maxHeight = "calc(" + window.innerHeight + "px - var(--topBarOffset)";
pathIterations.style.maxHeight = "calc(" + window.innerHeight + "px - var(--topBarOffset) - 107 * var(--base))";
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

function openPath() {
    generatePath();
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


var movePointEnabled = true;


var point = [0, 0];
var screenPoint = [0, 0];
var oldCoords = [];

function getPreset() {
    let settings = (new URL(window.location.href)).searchParams;

    let setCoords = (settings.get("coords") || "0").split(/(-*\d.*i*(?=-| ))/);
    let setScale = parseFloat(settings.get("scale") || 2);
    let setRes = parseInt(settings.get("res") || 200);
    let setIters = parseInt(settings.get("iters") || 16);
    let setContinuous = settings.has("continuous");

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

    drawPalettes(setContinuous, 1);


    return { x: setCoordX, y: setCoordY, scale: setScale, res: setRes, iters: setIters, continuous: setContinuous, showPaths: false };

}

var parameters = getPreset();

var confirmedWarning = false;

body.addEventListener("keydown", function () {
    if (event.keyCode == 13 && (parameters.res != res.value || parameters.iters != iters.value)) {
        parameters.res = res.value;
        parameters.iters = iters.value;
        iterations = Number(parameters.iters);
        drawMandelbrot(2);
        if(pathDescriptionAnimation.frame > 0)
            generatePath(false);
    }
});

function updateRes() {
    let v = Number(res.value);
    let r = "";

    if (v < 60)
        r = "Very low";
    else if (v < 160)
        r = "Low";
    else if (v < 320)
        r = "Default";
    else if (v < 600)
        r = "Medium";
    else if (v < 850)
        r = "High";
    else
        r = "Very high";
    resHint.innerText = r;
}
updateRes();
res.addEventListener("input", updateRes);
res.addEventListener("change", function () { parameters.res = this.value || 100; drawMandelbrot(2) });
iters.addEventListener("blur", function () { if (parameters.iters != this.value) { parameters.iters = this.value || 6; iterations = Number(parameters.iters); drawMandelbrot(2); generatePath(false) } });

continuousCheckbox.addEventListener("input", function () { parameters.continuous = this.checked; drawMandelbrot(2) });

function fixNumber(string, plusSign) {
    let re = new RegExp("(?![\\d|\\-|" + plusSign + "|.]).", "g");
    let newValue = string.replace(re, '0');
    let matches = [];


    if (!newValue.includes('.')) {
        matches = newValue.match(/\d/);
        let allSecondDigit = 0;
        if (matches) {
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
posRe.addEventListener("input", function () {
    let start = this.selectionStart, end = this.selectionEnd;
    this.value = fixNumber(this.value, ' ');
    this.setSelectionRange(start, end);
    point[0] = Number(this.value) || 0;
    screenPoint[0] = toScreenCoords(Number(this.value) || 0, 0)[0];
    markPoint();
    colorBar();
    if (pathDescriptionAnimation.frame > 0)
        generatePath();
}
);
posIm.addEventListener("input", function () {
    let start = this.selectionStart, end = this.selectionEnd;
    this.value = fixNumber(this.value, '+');
    this.setSelectionRange(start, end);
    point[1] = Number(this.value) || 0;
    screenPoint[1] = toScreenCoords(0, Number(this.value) || 0)[1];
    markPoint();
    colorBar();
    if (pathDescriptionAnimation.frame > 0)
        generatePath();
}
);

var finishedUpdatingCoords = false;

function updatePoint(x, y) {
    if (!shiftingWithMouse) {
        posRe.value = ((x >= 0) ? ' ' : '') + x.toFixed(17);
        posIm.value = ((y >= 0) ? '+' : '') + y.toFixed(17);
        point = [x, y];
    }
    if (mobile && !finishedUpdatingCoords) {
        posRe.value = ((x >= 0) ? ' ' : '') + x.toFixed(17);
        posIm.value = ((y >= 0) ? '+' : '') + y.toFixed(17);
        point = [x, y];
    }
    finishedUpdatingCoords = (pointLockAnimation.frame == 1)
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

    if (oldCoords[0] != parameters.x || oldCoords[1] != parameters.y || oldCoords[2] != parameters.scale) {
        if (movePointEnabled) {
            let newPoint = toCanvasCoords(screenPoint[0], screenPoint[1]);
            updatePoint(newPoint[0], newPoint[1]);
        }
        else
            updatePoint(point[0], point[1]);

        markPoint();
        if (pathDescriptionAnimation.frame > 0)
            generatePath();
    }
    oldCoords = [parameters.x, parameters.y, parameters.scale];

    if (parameters.showPaths && !confirmedWarning && parameters.iters > 30) {
        parameters.showPaths = false;
    }



    // Here we put all the custom parameters straight into the URL for easy access. It's also a great failsafe if you accidentally close the page.
    let historyString = "?"
        + ((parameters.res == 200) ? "" : "res=" + parameters.res + '&')
        + ((parameters.iters == 16) ? "" : "iters=" + parameters.iters + '&')
        + ((parameters.x == 0 && parameters.y == 0) ? "" : "coords=" + complexNumToString(parameters.x, parameters.y) + '&'
        )
        + ((parameters.scale == 2) ? "" : "scale=" + parameters.scale + '&')
        + ((parameters.continuous) ? "continuous" : "");
    if (historyString[historyString.length - 1] == '&')
        historyString = historyString.slice(0, -1);
    //window.history.replaceState({ "pageTitle": "Mandelbrot Set" }, "", historyString);

}

function toScreenCoords(x, y) {
    return [(x - parameters.x + width / 2) * canvasSize, (-y + parameters.y + height / 2) * canvasSize];
}

function toCanvasCoords(x, y) {
    return [x / canvasSize + parameters.x - width / 2, -y / canvasSize + parameters.y + height / 2];
}

var cursorScreenPosition = [canvas.width / 2, canvas.height / 2];
var cursorPosition = [parameters.x, parameters.y];
var touchDistance = null;


if (mobile) {
    Touch.prototype.canvasCoords = function () {
        return toCanvasCoords((this.clientX - boundingLeft) / transScale, (this.clientY - boundingTop) / transScale);
    }
}

var mobilePinchCenter = [];

function moveCursor(e) {
    if (!mobile) {
        cursorScreenPosition = [e.offsetX, e.offsetY];
        cursorPosition = [
            parameters.x + e.offsetX / canvasSize - width / 2,
            parameters.y - e.offsetY / canvasSize + height / 2
        ];
    }
    else {
        let touches = e.touches;
        if (touches.length > 1) {
            let tempTouchDistance = Math.sqrt((touches[0].clientX - touches[1].clientX) ** 2 + (touches[0].clientY - touches[1].clientY) ** 2);

            if (touchDistance)
                shiftScale(touchDistance / tempTouchDistance);
            else {
                touchDistance = tempTouchDistance;
                mobilePinchCenter = toCanvasCoords(((touches[0].clientX + touches[1].clientX) / 2 - boundingLeft) / transScale, ((touches[0].clientY + touches[1].clientY) / 2 - boundingTop) / transScale);
            }

            mobilePinchBegan = true;
        }
        else {
            cursorScreenPosition = [touches[0].clientX, touches[0].clientY];
            cursorPosition = touches[0].canvasCoords();
        }
    }

    if (movePointEnabled)
        movePoint();

    if(!mobile)
        if (barAnimation.frame == 0)
            barAnimation.open();
}


var barBackground = document.getElementById("barBackground");

function colorBar() {
    let iter = (parameters.continuous) ? iterateFSmooth(point[0], point[1]) : iterateF(point[0], point[1]);
    if (!interpolatingColors)
        topBar.style.backgroundColor = barBackground.style.backgroundColor = getColor(iter);
    topBar.iteration = barBackground.iteration = iter;
}


function movePoint() {
    let x = cursorPosition[0] - point[0];
    let y = cursorPosition[1] - point[1];
    let multiplier = (movePointEnabled) ? pointLockAnimation.frame : 0;
    updatePoint(point[0] + x * multiplier, point[1] + y * multiplier);

    colorBar();
    markPoint();
}

function markPoint() {
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
        overlayCanvas.style.cursor = (movePointEnabled) ? "none" : "grab";
        if (!movePointEnabled) {
            pointLockAnimation.close();
            pathOpenerAnimation.open();
        }
        else {
            pointLockAnimation.open();
            pathOpenerAnimation.close();
            closePath();
        }

    }
}


function startTouch(e) {
    cursorScreenPosition = [e.touches[0].clientX, e.touches[0].clientY];
    cursorPosition = e.touches[0].canvasCoords();
    movePointEnabled = true;
    pointLockAnimation.open();
    pathOpenerAnimation.close();
    closePath();
    touchDistance = null;
    if (barAnimation.frame == 0)
        barAnimation.open();
}

function endTouch(e) {
    movePointEnabled = false;
    pointLockAnimation.close();
    pathOpenerAnimation.open();
}


function getPathColor(iteration, prevCoords, currCoords, origCoords = []) {
    prevCoords = toScreenCoords(prevCoords.x, prevCoords.y);
    currCoords = toScreenCoords(currCoords.x, currCoords.y);
    if (origCoords.length > 0)
        if (!origCoords[2])
            return getColor(iteration) + ", " + getColor(iteration + ((parameters.continuous) ? 1 : 0));
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
        }
    }
    else
        return getColor(iteration);
}