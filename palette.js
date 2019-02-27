var programmerPalette = [];
for (let i = 1; i < 63; i++)
    programmerPalette.push('#' + ('000000' + Math.round(
        2 ** 24 * i / 63
    ).toString(16)).slice(-6));


var artistPalette = [];


var checkerPalette = [];




var palette = programmerPalette;








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



function drawPalettes(continuous) {
    for (let canvas of document.getElementsByClassName("paletteCanvas")) {
        canvas.height = 10;
        let ctx = canvas.getContext("2d");
        switch (canvas.id) {
            case "programmer":
                canvas.width = 10 * Math.max(programmerPalette.length, 20);
                canvas.style.width = "calc(" + 2 * canvas.width + " * var(--base))";
                if (continuous)
                    for (let i = 0; i < canvas.width; i++) {
                        ctx.fillStyle = lerpColor(
                            programmerPalette[Math.floor(i / 10) % programmerPalette.length],
                            programmerPalette[Math.ceil(i / 10) % programmerPalette.length],
                            (i / 10) % 1);
                        ctx.fillRect(i, 0, (i + 1), 10);
                    }
                else
                    for (let i = 0; i < canvas.width / 10; i++) {
                        ctx.fillStyle = programmerPalette[i % programmerPalette.length];
                        ctx.fillRect(i * 10, 0, (i + 1) * 10, 10);
                    }
                break;
        }
    }
}