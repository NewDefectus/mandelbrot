var body = document.getElementById("body");

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
    ["#ffffff", "#bbbbbb"],

    // Palette #4
    []
];


var interpolatingColors = false;

function interpolateParameterChange(frame) {
    if (frame == 0) {
        for (element of document.getElementsByClassName("colored")) {
            let hexValue = '#';
            for (let i of element.style.backgroundColor.split(/[^\d]*[^\d]/g).slice(1, 4))
                hexValue += ('00' + parseInt(i).toString(16)).slice(-2);
            element.originColor = hexValue;
        }
        interpolatingColors = true;
    }
    
    for (element of document.getElementsByClassName("colored")) {
        element.style.backgroundColor = lerpColor(element.originColor, palette[(element.iteration - 1 || 0) % palette.length], frame);//"rgb(" + rgbValues.join() + ")";
    }
    
    if (frame == 1) {
        oldPalette = [].concat(palette);
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
        if (index > iterations || index == -1)
            return "#000000";
        else
            return palette[(index - 1 + palette.length) % palette.length];
    }
    else
        return lerpColor(getColor(Math.floor(index) + 1), getColor(Math.ceil(index) + 1), index % 1)
}



var paletteInstance = createPaletteInstance();

function createPaletteInstance() {
    let paletteInstance = document.createElement("tr");
    let radioCell = document.createElement("td");
    let radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "palette";
    radioCell.appendChild(radio);
    paletteInstance.appendChild(radioCell);

    let paletteCell = document.createElement("td");
    let paletteCanvas = document.createElement("canvas");
    paletteCanvas.className = "paletteCanvas";
    paletteCanvas.width = 600;
    paletteCanvas.height = 1;
    paletteCell.appendChild(paletteCanvas);
    paletteInstance.appendChild(paletteCell);

    paletteInstance.style.height = "calc(40 * var(--base))";

    return paletteInstance;
}

var table = document.getElementById("palettes");
var paletteRows = [];

function switchPalette(num) {
    oldPalette = [].concat(palette);
    palette = palettes[num];
    body.style.backgroundColor = palette[0];
    drawMandelbrot(2);
    markPoint();
}

for (let i = 0; i < palettes.length; i++) {
    let inst = table.appendChild(paletteInstance.cloneNode(true));
    let radio = inst.getElementsByTagName("input")[0];
    if (i == 0) radio.checked = true;
    radio.addEventListener("input", function () { switchPalette(i) });
    let canvas = inst.getElementsByClassName("paletteCanvas")[0];

    if (i == palettes.length - 1)
        makeImageInput(canvas.parentElement, canvas, radio);

    paletteRows.push({
        palette: palettes[i],
        canvas: canvas,
        draw: drawPalette,
        radio: radio
    }
    );

}

var palette = palettes[0];
var oldPalette = [].concat(palette);
var interpolatedPalette = [].concat(palette);
body.style.backgroundColor = palette[0];



function makeImageInput(container, canvas, radio) {
    container.style.width = canvas.style.width;
    radio.disabled = true;

    let inputLabel = document.createElement("label");
    inputLabel.for = "upload";

    let arrow = document.createElement("span");
    arrow.style = "width: 100%; height: 12.5%; position: absolute; text-align: center; color: white; font-size: calc(30 * var(--base)); cursor: pointer; line-height: calc(35 * var(--base))";
    arrow.innerHTML = "&#8963;";

    let input = document.createElement("input");
    input.id = "upload";
    input.type = "file";
    input.style.display = "none";
    input.accept = "image/*";
    input.oninput = getImage;

    inputLabel.appendChild(input);
    inputLabel.appendChild(arrow);
    container.insertBefore(inputLabel, canvas);
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
            console.log(data);
            let newPalette = [];
            for (i = 0; i < data.length; i += 4)
                newPalette.push(
                    '#' +
                    ('00' + data[i].toString(16)).slice(-2) +
                    ('00' + data[i + 1].toString(16)).slice(-2) +
                    ('00' + data[i + 2].toString(16)).slice(-2)
                );

            row.radio.disabled = false;
            row.radio.checked = true;
            palettes[palettes.length - 1] = newPalette;
            paletteRows[paletteRows.length - 1].palette = newPalette;
            drawPalettes();

            switchPalette(palettes.length - 1);

            e.target.value = "";
        }
        img.crossOrigin = "Anonymous";
        img.src = URL.createObjectURL(e.target.files[0]);
    }
}






function drawPalette(continuous) {
    let canvas = this.canvas;
    let palette = this.palette;
    let ctx = canvas.getContext("2d");

    let colorSize = ctx.canvas.width / palette.length;

    if (continuous)
        for (let i = 0; i < canvas.width; i++) {
            ctx.fillStyle = lerpColor(
                palette[Math.floor(i / colorSize) % palette.length],
                palette[Math.ceil(i / colorSize) % palette.length],
                (i / colorSize) % 1);
            ctx.fillRect(i, 0, (i + 1), 15);
        }
    else
        for (let i = 0; i < canvas.width / colorSize; i++) {
            ctx.fillStyle = palette[i % palette.length];
            ctx.fillRect(i * colorSize, 0, (i + 1) * colorSize, 1);
        }
}



function drawPalettes(continuous) {
    for (let row of paletteRows) {
        if(row.palette.length > 0)
            row.draw(continuous);
    }
}