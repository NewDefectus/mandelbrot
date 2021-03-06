﻿var body = document.getElementById("body");

var palettes = [

    // Palette #1
    function () {
        let arr = [];
        for (let i = 1; i < 63; i++)
            arr.push('#' + ('000000' + Math.round(
                2 ** 24 * i / 63
            ).toString(16)).slice(-6));
        return arr;
    }(),

    // Palette #2
    function () {
        let arr = [];
        for (let i = 0; i < 100; i++) {
            if (i < 16)
                arr.push(lerpColor("#000764", "#206bcb", i / 16));
            else if (i < 42)
                arr.push(lerpColor("#206bcb", "#edffff", (i - 16) / 26));
            else if (i < 64)
                arr.push(lerpColor("#edffff", "#ffaa00", (i - 42) / 22));
            else if (i < 86)
                arr.push(lerpColor("#ffaa00", "#000200", (i - 64) / 22));
            else
                arr.push(lerpColor("#000200", "#000764", (i - 86) / 14));
        }
        return arr;
    }(),

    // Palette #3
    function () {
        let arr = [];
        for (let i = 0; i < 50; i++) {
            if (i % 2 == 0)
                arr.push("#ffffff");
            else
                arr.push("#bbbbbb");
        }
        return arr;
    }(),

    // Palette #4 (customizable)
    []
];


var interpolatingColors = false;

function rgbToHex(str) {
    let hexValue = '#';
    for (let i of str.split(/[^\d]*[^\d]/g).slice(1, 4))
        hexValue += ('00' + parseInt(i).toString(16)).slice(-2);
    return hexValue;
}

function interpolateParameterChange(frame) {
    if (frame > 1)
        frame = 1;

    if (frame == 0) {
        for (let element of document.getElementsByClassName("colored")) {
            if (!element.gradient) {
                element.originColor = rgbToHex(element.style.backgroundColor);
                element.iteration = (parameters.continuous) ? iterateFSmooth(point[0], point[1]) : iterateF(point[0], point[1]);
            }
            else {
                let colors = element.style.backgroundImage.split(/linear-gradient\(rgb|, rgb/g).slice(1, 3);
                element.originColor = [rgbToHex(colors[0]), rgbToHex(colors[1])];
            }
        }
        interpolatingColors = true;
    }
    
    for (let element of document.getElementsByClassName("colored")) {
        if (!element.gradient)
            element.style.backgroundColor = lerpColor(element.originColor, getColor(element.iteration || 0), smoothStep(frame));
        else
            element.style.backgroundImage =
                "linear-gradient(" +
                lerpColor(element.originColor[0], getColor(element.iteration || 0), smoothStep(frame)) +
                ", " +
                lerpColor(element.originColor[1], getColor(element.iteration + ((parameters.continuous) ? 1 : 0) || 0), smoothStep(frame));
    }
    
    drawPalettes(parameters.continuous, frame);
    
    if (frame == 1) {
        interpolatingColors = false;
    }
}




function lerpColor(a, b, amount) {
    let ah = parseInt(a.replace(/#/g, ''), 16),
        ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
        bh = parseInt(b.replace(/#/g, ''), 16),
        br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
        rr = ar + amount * (br - ar),
        rg = ag + amount * (bg - ag),
        rb = ab + amount * (bb - ab);

    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
}



function getColor(index)
{
    if (index % 1 == 0) {
        if (index > iterations + (juliaSetCoords.length != 0) || index == -1)
            return "#000000";
        else
            return palette[(index - 1 + palette.length) % palette.length];
    }
    else
        return lerpColor(getColor(Math.floor(index) + 1), getColor(Math.ceil(index) + 1), index % 1)
}



var paletteInstance = createPaletteInstance();

function createPaletteInstance() {
    let paletteInstance = document.createElement("div");
    paletteInstance.className = "paletteCanvasContainer";
    
    let paletteCanvas = document.createElement("canvas");
    paletteCanvas.style.opacity = 0.5;
    paletteCanvas.className = "paletteCanvas";
    paletteCanvas.width = 600;
    paletteCanvas.height = 1;
    paletteInstance.appendChild(paletteCanvas);
    
    return paletteInstance;
}

var paletteMenu = document.getElementById("palettes");
var paletteRows = [];

function switchPalette() {
    if (!this.chosen && this.palette.length > 0) {
        for (let p of paletteRows) {
            if (p.chosen && p.palette)
                p.canvas.style.cursor = "pointer";
            p.chosen = false;
        }

        palette = this.palette;
        this.canvas.style.cursor = "default";
        this.chosen = true;

        body.style.backgroundColor = palette[0];
        drawMandelbrot(2);
    }
}

for (let i = 0; i < palettes.length; i++) {
    let inst = paletteMenu.appendChild(paletteInstance.cloneNode(true));
    inst.palette = palettes[i];
    inst.canvas = inst.getElementsByClassName("paletteCanvas")[0];
    inst.draw = drawPalette;
    inst.lastOpacity = (i == 0) ? 1 : 0.5;
    inst.chosen = i == 0;
    inst.addEventListener("click", switchPalette);

    inst.canvas.style.cursor = (i == 0 || i == palettes.length - 1) ? "default" : "pointer";

    if (i == palettes.length - 1)
        makeImageInput(inst, inst.canvas);

    paletteRows.push(inst);
}

var palette = palettes[0];
var interpolatedPalette = [].concat(palette);
body.style.backgroundColor = palette[0];



function makeImageInput(container, canvas) {
    let inputLabel = document.createElement("label");
    inputLabel.for = "upload";

    let arrow = document.createElement("span");
    arrow.id = "uploadArrow";
    arrow.style = "height: 12.5%; position: absolute; left: 50%; text-align: center; color: white; font-size: calc(30 * var(--base)); cursor: pointer; line-height: calc(35 * var(--base))";
    arrow.innerHTML = "&#8963;";

    let input = document.createElement("input");
    input.id = "upload";
    input.type = "file";
    input.style.display = "none";
    input.accept = "image/*";
    input.oninput = getImage;

    inputLabel.appendChild(input);
    inputLabel.appendChild(arrow);
    container.appendChild(inputLabel);//insertBefore(inputLabel, canvas);
}





function getImage(e) {
    if (e.target.files) {
        let img = new Image;
        img.onload = function () {
            URL.revokeObjectURL(img.src);
            let row = paletteRows[paletteRows.length - 1];
            let ctx = row.canvas.getContext("2d");
            ctx.canvas.width = img.width;
            ctx.drawImage(img, 0, 0, img.width, 1);

            let data = ctx.getImageData(0, 0, img.width, 1).data;
            ctx.canvas.width = 600;
            let newPalette = [];
            for (i = 0; i < data.length; i += 4)
                newPalette.push(
                    '#' +
                    ('00' + data[i].toString(16)).slice(-2) +
                    ('00' + data[i + 1].toString(16)).slice(-2) +
                    ('00' + data[i + 2].toString(16)).slice(-2)
                );
            
            palettes[palettes.length - 1] = newPalette;
            row.palette = newPalette;
            row.s = switchPalette;
            row.s();

            e.target.value = "";
        }
        img.crossOrigin = "Anonymous";
        img.src = URL.createObjectURL(e.target.files[0]);
    }
}



var prevFrame = 0;


function drawPalette(continuous, frame) {
    let canvas = this.canvas;
    let palette = this.palette;
    let ctx = canvas.getContext("2d");

    let colorSize = canvas.width / palette.length;

    if (frame == 0)
        this.lastOpacity = Number(canvas.style.opacity);
    else if (this.chosen)
        canvas.style.opacity = this.lastOpacity + frame * (1 - this.lastOpacity);
    else
        canvas.style.opacity = this.lastOpacity + frame * (0.5 - this.lastOpacity);

    if (continuous) {
        for (let i = prevFrame * canvas.width; i < frame * canvas.width; i++) {
            ctx.fillStyle = lerpColor(
                palette[Math.floor(i / colorSize) % palette.length],
                palette[Math.ceil(i / colorSize) % palette.length],
                (i / colorSize) % 1);
            ctx.fillRect(i, 0, 1, 1);
        }
    }
    else {
        for (let i = prevFrame * canvas.width; i < frame * canvas.width; i++) {
            ctx.fillStyle = palette[Math.floor(i / colorSize) % palette.length];
            ctx.fillRect(i, 0, 1, 1);
        }
    }
}



function drawPalettes(continuous, frame) {
    for (let row of paletteRows) {
        if(row.palette.length > 0)
            row.draw(continuous, frame);
    }
    prevFrame = (frame != 1) ? frame : 0;
}