/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   {number}  r       The red color value
 * @param   {number}  g       The green color value
 * @param   {number}  b       The blue color value
 * @return  {Array}           The HSL representation
 */
function rgbToHsl(r, g, b){
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
}

function mod (n, m) {
    var remain = n % m;
    return Math.floor(remain >= 0 ? remain : remain + m);
}

/**
 * By Ken Fyrstenberg Nilsen
 *
 * drawImageProp(context, image [, x, y, width, height [,offsetX, offsetY]])
 *
 * If image and context are only arguments rectangle will equal canvas
*/
function drawImageProp(ctx, img, x, y, w, h, offsetX, offsetY) {

    if (arguments.length === 2) {
        x = y = 0;
        w = ctx.canvas.width;
        h = ctx.canvas.height;
    }

    // default offset is center
    offsetX = typeof offsetX === "number" ? offsetX : 0.5;
    offsetY = typeof offsetY === "number" ? offsetY : 0.5;

    // keep bounds [0.0, 1.0]
    if (offsetX < 0) offsetX = 0;
    if (offsetY < 0) offsetY = 0;
    if (offsetX > 1) offsetX = 1;
    if (offsetY > 1) offsetY = 1;

    var iw = img.width,
        ih = img.height,
        r = Math.min(w / iw, h / ih),
        nw = iw * r,   // new prop. width
        nh = ih * r,   // new prop. height
        cx, cy, cw, ch, ar = 1;

    // decide which gap to fill    
    if (nw < w) ar = w / nw;                             
    if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;  // updated
    nw *= ar;
    nh *= ar;

    // calc source rectangle
    cw = iw / (nw / w);
    ch = ih / (nh / h);

    cx = (iw - cw) * offsetX;
    cy = (ih - ch) * offsetY;

    // make sure source rectangle is valid
    if (cx < 0) cx = 0;
    if (cy < 0) cy = 0;
    if (cw > iw) cw = iw;
    if (ch > ih) ch = ih;

    // fill image in dest. rectangle
    ctx.drawImage(img, cx, cy, cw, ch,  x, y, w, h);
}


var canvas = document.getElementsByTagName('canvas')[0]
ctx = canvas.getContext('2d')

ctx.canvas.width  = window.innerWidth;
ctx.canvas.height = window.innerHeight;

base_image = new Image();
base_image.src = 'E21qLE1WEAQIWnD.jpg';

const transBlueHSL = rgbToHsl(85, 205, 252);
const transPinkHSL = rgbToHsl(247, 168, 184);
const transWhiteHSL = rgbToHsl(255, 255, 255);

var difference = function (a, b) { return Math.abs(a - b); }

base_image.onload = function() {
    redraw(0.2);
}

function differenceCheck(a, b, tolerance) {
    return (difference(a[0], b[0]) < tolerance && difference(a[1], b[1]) < tolerance && difference(a[2], b[2]) < tolerance)
}

function leastDifference(a, b, c) {
    return (a < b && a < c)
}

function redraw(tolerance) {
    var blueColors = [];
    var pinkColors = [];
    var whiteColors = [];

    var ct = document.getElementById('measure'); 
    ct.appendChild(base_image);
    var wrh = base_image.width / base_image.height;
    var newWidth = canvas.width;
    var newHeight = newWidth / wrh;
    if (newHeight > canvas.height) {
        newHeight = canvas.height;
        newWidth = newHeight * wrh;
    }
    ct.removeChild(base_image);
    ctx.drawImage(base_image,0,0, newWidth , newHeight);

	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (i = 0; i < data.length; i += 4) {
        if(data[i + 3] == 0) {
            continue;
        }
        hslPixel = rgbToHsl(data[i], data[i + 1], data[i + 2]);
        // console.log(difference(hslPixel[0], transBlueHSL[0]))

        diffBlu = difference(transBlueHSL[0], hslPixel[0])
        diffPin = difference(transPinkHSL[0], hslPixel[0])
        diffWhite = difference(transWhiteHSL[0], hslPixel[0])

        if(leastDifference(diffBlu, diffPin, diffWhite) && differenceCheck(transBlueHSL, hslPixel, tolerance)) {
            blueColors.push([data[i], data[i + 1], data[i + 2]])
            continue
        }

        if(leastDifference(diffPin, diffBlu, diffWhite) && differenceCheck(transPinkHSL, hslPixel, tolerance)) {
            pinkColors.push([data[i], data[i + 1], data[i + 2]])
            continue
        }

        if(leastDifference(diffWhite, diffBlu, diffPin) && differenceCheck(transWhiteHSL, hslPixel, tolerance)) {
            whiteColors.push([data[i], data[i + 1], data[i + 2]])
            continue
        }
        var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i]     = avg; // red
        data[i + 1] = avg; // green
        data[i + 2] = avg; // blue    
    }

    document.querySelectorAll('.transblue').forEach(element => {
        element.style.backgroundColor = averageColors(blueColors);
    });

    document.querySelectorAll('.transpink').forEach(element => {
        element.style.backgroundColor = averageColors(pinkColors);
    });

    document.querySelectorAll('.transwhite').forEach(element => {
        element.style.backgroundColor = averageColors(whiteColors);
    });

    ctx.putImageData(imageData, 0, 0);
}

function averageColors( colorArray ){
    var red = 0, green = 0, blue = 0;

    for ( var i = 0; i < colorArray.length; i++ ){
        red += colorArray[i][0]
        green += colorArray[i][1]
        blue += colorArray[i][2]
    }

    //Average RGB
    red = (red/colorArray.length);
    green = (green/colorArray.length);
    blue = (blue/colorArray.length);

    // console.log(red + ", " + green + ", " + blue);
    return "rgb("+ red +","+ green +","+ blue +")";
}

var slider = document.getElementById("myRange");
var output = document.getElementById("demo");
output.innerHTML = slider.value;

slider.oninput = function() {
  output.innerHTML = this.value;
  redraw(this.value / 100)
}