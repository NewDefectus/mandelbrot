function createPalette() {
    // I initially generated a color for every pixel before I realized it's much more efficient to have a preset palette with a color for each iteration.
    let palette = [];

    let newColor = "";
    for (let i = 1; i < 63; i++) {
        newColor = '#' + ('000000' + Math.round(
            2 ** 24 * i / 63
        ).toString(16)).slice(-6);
        palette.push(newColor);
    }
    return palette;
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
    return palette[(index - 1 + palette.length) % palette.length];
}