if (mobile) {
    overlayCanvas.addEventListener("touchstart", startShift, { passive: true });
    overlayCanvas.addEventListener("touchmove", moveShift, { passive: true });
    overlayCanvas.addEventListener("touchend", endShift);
    overlayCanvas.addEventListener("mouseleave", endShift);

    overlayCanvas.addEventListener("touchstart", startTouch, { passive: true } );
    overlayCanvas.addEventListener("touchend", endTouch);
    overlayCanvas.addEventListener("mouseleave", endTouch);
    overlayCanvas.addEventListener("touchmove", moveCursor, { passive: true });
}
else {
    overlayCanvas.addEventListener("mousedown", startShift);
    overlayCanvas.addEventListener("mousemove", moveShift);
    overlayCanvas.addEventListener("mouseup", endShift);
    overlayCanvas.addEventListener("mouseleave", endShift);
    overlayCanvas.addEventListener("wheel", shiftScale, { passive: true });
    body.addEventListener("keydown", startNavWithKeyboard);
    body.addEventListener("keyup", endNavWithKeyboard);
    overlayCanvas.addEventListener("mousemove", moveCursor);
    overlayCanvas.addEventListener("contextmenu", togglePointLock);
}

var navKeys = [
    false,
    false,
    false,
    false,
    false,
    false,
    false
];

var navDict = {
    up: [87, 38, 104],      // Move up      w / up arrow / 8 (keypad)
    left: [65, 37, 100],    // Move left    a / left arrow / 4 (keypad)
    down: [83, 40, 98],     // Move down    s / down arrow / 2 ( keypad)
    right: [68, 39, 102],   // Move right   d / right arrow / 6 (keypad)
    in: [187, 107, 90],     // Zoom in      = / + (keypad) / z
    out: [189, 109, 88],    // Zoom out     - / - (keypad) / x
    speed: 16               // Speed        shift
};
var navigatingWithKeyboard = false;

function startNavWithKeyboard(e) {
    if (pathDescriptionAnimation.frame > 0 || settingsAnimation.frame > 0 || e.target != body)
        return 0;
    let code = e.keyCode;
    if (navDict.up.includes(code))
        navKeys[0] = true;
    else if (navDict.left.includes(code))
        navKeys[1] = true;
    else if (navDict.down.includes(code))
        navKeys[2] = true;
    else if (navDict.right.includes(code))
        navKeys[3] = true;
    else if (navDict.in.includes(code))
        navKeys[4] = true;
    else if (navDict.out.includes(code))
        navKeys[5] = true;
    else if (navDict.speed == code)
        navKeys[6] = true;
    else
        return 0;

    // If any key is pressed and the interval hasn't started, begin the interval
    if (!navigatingWithKeyboard && (navKeys[0] || navKeys[1] || navKeys[2] || navKeys[3] || navKeys[4] || navKeys[5])) {
        navigatingWithKeyboard = true;
        nudgeCallbacks();
    }
}

var keyboardShift = [0, 0];

function navWithKeyboard() {
    placeShiftingCanvas();
    if (pathDescriptionAnimation.frame > 0 || settingsAnimation.frame > 0) {
        if (navigatingWithKeyboard) {
            for (let i = 0; i < navKeys.length; i++)
                navKeys[i] = false;
            endNavWithKeyboard();
        }
        return 0;
    }

    // Shifting
    if ((navKeys[0] || navKeys[1] || navKeys[2] || navKeys[3]) && !shiftingWithMouse) {
        shifting = true;
        shiftMoved = true;
        let baseUnit = parameters.scale / (navKeys[6] ? 40 : 80);
        keyboardShift[1] += baseUnit * navKeys[0];
        keyboardShift[0] -= baseUnit * navKeys[1];
        keyboardShift[1] -= baseUnit * navKeys[2];
        keyboardShift[0] += baseUnit * navKeys[3];
    }


    // Scaling
    if (navKeys[4] || navKeys[5]) {
        scaling = true;
        hasScaled = true;
        let scalar = (navKeys[6] ? 1.05 : 1.02) ** (navKeys[5] - navKeys[4]);
        scaleCenter = toCanvasCoords(cursorScreenPosition[0], cursorScreenPosition[1]);
        transformation.scale *= scalar;
        scalingShift[0] += (scaleCenter[0] - parameters.x) * (1 - scalar);
        scalingShift[1] += (scaleCenter[1] - parameters.y) * (1 - scalar);
        canvasSize = canvas.width / (oldPos.scale * transformation.scale * 2);
    }

    drawMandelbrot(0);
    if (movePointEnabled) {
        let sp = toCanvasCoords(screenPoint[0], screenPoint[1]);
        updatePoint(sp[0], sp[1]);
        colorBar();
    }
}

function endNavWithKeyboard(e) {
    if (pathDescriptionAnimation.frame == 0 && settingsAnimation.frame == 0) {
        let code = e.keyCode;
        if (navDict.up.includes(code))
            navKeys[0] = false;
        else if (navDict.left.includes(code))
            navKeys[1] = false;
        else if (navDict.down.includes(code))
            navKeys[2] = false;
        else if (navDict.right.includes(code))
            navKeys[3] = false;
        else if (navDict.in.includes(code))
            navKeys[4] = false;
        else if (navDict.out.includes(code))
            navKeys[5] = false;
        else if (navDict.speed == code)
            navKeys[6] = false;
        else
            return 0;
    }

    let prevNavigatingWithKeyboard = navigatingWithKeyboard;

    // If no keys are pressed and the interval has started, stop the interval
    if (navigatingWithKeyboard && !(navKeys[0] || navKeys[1] || navKeys[2] || navKeys[3] || navKeys[4] || navKeys[5]))
        navigatingWithKeyboard = false;

    if (!(navKeys[0] || navKeys[1] || navKeys[2] || navKeys[3]) && !shiftingWithMouse) {
        shifting = false;
        shiftMoved = false;
    }

    if (!(navKeys[4] || navKeys[5]) && !scalingWithMouse) {
        scaling = false;
        if (!shiftingWithMouse)
            hasScaled = false;
    }
    if (!prevNavigatingWithKeyboard)
        return 0;

    if (!scaling && !shifting) {
        if (backupCanvas.parentNode == canvasContainer)
            canvasContainer.removeChild(backupCanvas);
        drawMandelbrot(1);
    }
}

var shiftCoords = [0, 0];
var shifting = false;
var shiftingWithMouse = false;
var shiftMoved = false;

function placeShiftingCanvas() {
    if (backupCanvas.parentNode != canvasContainer) {
        backupCanvas.style.transform = "translate(-50%, -50%)";
        backupCtx.drawImage(canvas, 0, 0);
        canvasContainer.insertBefore(backupCanvas, overlayCanvas);
        oldPos.x = parameters.x;
        oldPos.y = parameters.y;
        oldPos.scale = parameters.scale;
    }
}

function startShift(e) {
    if (!mobile || !movePointEnabled) {
        if (!shiftingWithMouse) {
            if (overlayCanvas.style.cursor == "grab")
                overlayCanvas.style.cursor = "grabbing";
            placeShiftingCanvas();
            shiftCoords = (!mobile) ? [
                e.offsetX,
                -e.offsetY
            ]
                :
                [
                    e.touches[0].clientX,
                    -e.touches[0].clientY
                ]
        }
        shifting = true;
        shiftingWithMouse = true;
    }
}

function moveShift(e) {
    if (shiftingWithMouse) {
        shiftMoved = true;
        if (!(mobile && scaling)) {
            if (mobile) {
                transformation.x = (shiftCoords[0] - e.touches[0].clientX) / transScale / canvasSize;
                transformation.y = (shiftCoords[1] + e.touches[0].clientY) / transScale / canvasSize;
            }
            else {
                transformation.x = (shiftCoords[0] - e.offsetX) / canvasSize;
                transformation.y = (shiftCoords[1] + e.offsetY) / canvasSize;
            }

            drawMandelbrot(0);
        }
    }
}

function endShift() {
    if (!mobile || !movePointEnabled) {
        if (!scaling) {
            if (backupCanvas.parentNode == canvasContainer)
                canvasContainer.removeChild(backupCanvas);
            if (shiftMoved || hasScaled)
                drawMandelbrot(1);
        }
        if (overlayCanvas.style.cursor == "grabbing")
            overlayCanvas.style.cursor = "grab";

        shiftCoords = [0, 0];
        shiftMoved = false;
        hasScaled = false;
        shifting = false;
        shiftingWithMouse = false;

        if (mobile)
            if (scaling)
                shiftScale(0);
    }
}

var scaling = false;
var hasScaled = false;
var scalingWithMouse = false;
var scalingTimeout = null;
var scalingShift = [0, 0];

function shiftScale(e) {
    // And this is to zoom in and out on the complex plane
    if (!mobile || !movePointEnabled) {
        if (mobile && e == 0) {
            if (!shifting) {
                if (backupCanvas.parentNode == canvasContainer)
                    canvasContainer.removeChild(backupCanvas);
                hasScaled = false;
                drawMandelbrot(1);
            }
            scaling = false;
            scalingWithMouse = false;
            return 0;
        }


        if (!scaling)
            placeShiftingCanvas();

        let scaleCenter = [];
        if (mobile) {
            let scalar = e / transformation.scale;
            scalingShift[0] += (mobilePinchCenter[0] - parameters.x) * (1 - scalar);
            scalingShift[1] += (mobilePinchCenter[1] - parameters.y) * (1 - scalar);
            transformation.scale = e;
        }
        else {
            let scalar = (navKeys[6] ? 1.2 : 1.1) ** Math.sign(e.deltaY);
            scaleCenter = toCanvasCoords(e.offsetX, e.offsetY);
            transformation.scale *= scalar;
            scalingShift[0] += (scaleCenter[0] - parameters.x) * (1 - scalar);
            scalingShift[1] += (scaleCenter[1] - parameters.y) * (1 - scalar);
        }


        canvasSize = canvas.width / (oldPos.scale * transformation.scale * 2);

        if (shifting) {
            if (!mobile) {
                scalingShift[0] += transformation.x;
                scalingShift[1] += transformation.y;
                transformation.x = 0;
                transformation.y = 0;
            }
            shiftCoords = [cursorScreenPosition[0], -cursorScreenPosition[1]];
        }
        else
            drawTimeouts = [];


        drawMandelbrot(0);
        scaling = true;
        hasScaled = true;
        scalingWithMouse = true;
        if (!mobile) {
            clearTimeout(scalingTimeout);
            scalingTimeout = setTimeout(function () {
                if (!shifting) {
                    if (backupCanvas.parentNode == canvasContainer)
                        canvasContainer.removeChild(backupCanvas);
                    hasScaled = false;
                    drawMandelbrot(1);
                }
                scaling = false;
                scalingWithMouse = false;
            }, 250);

            if (movePointEnabled) {
                let newPoint = toCanvasCoords(screenPoint[0], screenPoint[1]);
                updatePoint(newPoint[0], newPoint[1]);
                colorBar();
            }
            else
                updatePoint(point[0], point[1]);
            markPoint();
        }
    }
}