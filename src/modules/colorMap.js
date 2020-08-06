/* eslint-disable no-undef */
const colorMap = {
    AliceBlue: "f0f8ff",
    AntiqueWhite: "faebd7",
    Aqua: "00ffff",
    Aquamarine: "7fffd4",
    Azure: "f0ffff",
    Beige: "f5f5dc",
    Bisque: "ffe4c4",
    Black: "000000",
    BlanchedAlmond: "ffebcd",
    Blue: "0000ff",
    BlueViolet: "8a2be2",
    Brown: "a52a2a",
    BurlyWood: "deb887",
    CadetBlue: "5f9ea0",
    Chartreuse: "7fff00",
    Chocolate: "d2691e",
    Coral: "ff7f50",
    CornflowerBlue: "6495ed",
    Cornsilk: "fff8dc",
    Crimson: "dc143c",
    Cyan: "00ffff",
    DarkBlue: "00008b",
    DarkCyan: "008b8b",
    DarkGoldenRod: "b8860b",
    DarkGray: "a9a9a9",
    DarkGrey: "a9a9a9",
    DarkGreen: "006400",
    DarkKhaki: "bdb76b",
    DarkMagenta: "8b008b",
    DarkOliveGreen: "556b2f",
    DarkOrange: "ff8c00",
    DarkOrchid: "9932cc",
    DarkRed: "8b0000",
    DarkSalmon: "e9967a",
    DarkSeaGreen: "8fbc8f",
    DarkSlateBlue: "483d8b",
    DarkSlateGray: "2f4f4f",
    DarkSlateGrey: "2f4f4f",
    DarkTurquoise: "00ced1",
    DarkViolet: "9400d3",
    DeepPink: "ff1493",
    DeepSkyBlue: "00bfff",
    DimGray: "696969",
    DimGrey: "696969",
    DodgerBlue: "1e90ff",
    FireBrick: "b22222",
    FloralWhite: "fffaf0",
    ForestGreen: "228b22",
    Fuchsia: "ff00ff",
    Gainsboro: "dcdcdc",
    GhostWhite: "f8f8ff",
    Gold: "ffd700",
    GoldenRod: "daa520",
    Gray: "808080",
    Grey: "808080",
    Green: "008000",
    GreenYellow: "adff2f",
    HoneyDew: "f0fff0",
    HotPink: "ff69b4",
    IndianRed: "cd5c5c",
    Indigo: "4b0082",
    Ivory: "fffff0",
    Khaki: "f0e68c",
    Lavender: "e6e6fa",
    LavenderBlush: "fff0f5",
    LawnGreen: "7cfc00",
    LemonChiffon: "fffacd",
    LightBlue: "add8e6",
    LightCoral: "f08080",
    LightCyan: "e0ffff",
    LightGoldenRodYellow: "fafad2",
    LightGray: "d3d3d3",
    LightGrey: "d3d3d3",
    LightGreen: "90ee90",
    LightPink: "ffb6c1",
    LightSalmon: "ffa07a",
    LightSeaGreen: "20b2aa",
    LightSkyBlue: "87cefa",
    LightSlateGray: "778899",
    LightSlateGrey: "778899",
    LightSteelBlue: "b0c4de",
    LightYellow: "ffffe0",
    Lime: "00ff00",
    LimeGreen: "32cd32",
    Linen: "faf0e6",
    Magenta: "ff00ff",
    Maroon: "800000",
    MediumAquaMarine: "66cdaa",
    MediumBlue: "0000cd",
    MediumOrchid: "ba55d3",
    MediumPurple: "9370db",
    MediumSeaGreen: "3cb371",
    MediumSlateBlue: "7b68ee",
    MediumSpringGreen: "00fa9a",
    MediumTurquoise: "48d1cc",
    MediumVioletRed: "c71585",
    MidnightBlue: "191970",
    MintCream: "f5fffa",
    MistyRose: "ffe4e1",
    Moccasin: "ffe4b5",
    NavajoWhite: "ffdead",
    Navy: "000080",
    OldLace: "fdf5e6",
    Olive: "808000",
    OliveDrab: "6b8e23",
    Orange: "ffa500",
    OrangeRed: "ff4500",
    Orchid: "da70d6",
    PaleGoldenRod: "eee8aa",
    PaleGreen: "98fb98",
    PaleTurquoise: "afeeee",
    PaleVioletRed: "db7093",
    PapayaWhip: "ffefd5",
    PeachPuff: "ffdab9",
    Peru: "cd853f",
    Pink: "ffc0cb",
    Plum: "dda0dd",
    PowderBlue: "b0e0e6",
    Purple: "800080",
    RebeccaPurple: "663399",
    Red: "ff0000",
    RosyBrown: "bc8f8f",
    RoyalBlue: "4169e1",
    SaddleBrown: "8b4513",
    Salmon: "fa8072",
    SandyBrown: "f4a460",
    SeaGreen: "2e8b57",
    SeaShell: "fff5ee",
    Sienna: "a0522d",
    Silver: "c0c0c0",
    SkyBlue: "87ceeb",
    SlateBlue: "6a5acd",
    SlateGray: "708090",
    SlateGrey: "708090",
    Snow: "fffafa",
    SpringGreen: "00ff7f",
    SteelBlue: "4682b4",
    Tan: "d2b48c",
    Teal: "008080",
    Thistle: "d8bfd8",
    Tomato: "ff6347",
    Turquoise: "40e0d0",
    Violet: "ee82ee",
    Wheat: "f5deb3",
    White: "ffffff",
    WhiteSmoke: "f5f5f5",
    Yellow: "ffff00",
    YellowGreen: "9acd32",
};

const round = Math.round;
var defaultColor = "rgba(0,0,0,0)";

function RGBA(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a === undefined ? 255 : a;
    this.rgba = `rgba(${r},${g},${b},${a})`;
}

RGBA.prototype.normalize = function () {
    if (!this.normalFlag) {
        this.r /= 255;
        this.g /= 255;
        this.b /= 255;
        this.a /= 255;
        this.normalFlag = true;
    }
    return this;
};

function nameToHex(name) {
    return colorMap[name] ? `#${colorMap[name]}` : "#000";
}

function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return new RGBA(parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16), 255);
}

function rgbToHex(rgb) {
    const rgbComponents = rgb.substring(rgb.lastIndexOf("(") + 1, rgb.lastIndexOf(")")).split(",");
    const r = parseInt(rgbComponents[0], 10);
    const g = parseInt(rgbComponents[1], 10);
    const b = parseInt(rgbComponents[2], 10);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function rgbParse(rgb) {
    const res = rgb.replace(/[^0-9.,]+/g, "").split(",");
    const obj = {};
    const flags = ["r", "g", "b", "a"];

    for (let i = 0; i < res.length; i += 1) {
        obj[flags[i]] = parseFloat(res[i]);
    }

    return new RGBA(obj.r, obj.g, obj.b, obj.a);
}

function hslParse(hsl) {
    var r;
    var g;
    var b;
    var a;
    var h;
    var s;
    var l;
    var obj = {};
    const res = hsl
        .replace(/[^0-9.,]+/g, "")
        .split(",")
        .map(function (d) {
            return parseFloat(d);
        });
    h = res[0] / 360;
    s = res[1] / 100;
    l = res[2] / 100;
    a = res[3];

    if (s === 0) {
        r = g = b = l;
    } else {
        var hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3) * 255;
        g = hue2rgb(p, q, h) * 255;
        b = hue2rgb(p, q, h - 1 / 3) * 255;
    }

    if (a !== undefined) obj.a = a;
    return new RGBA(r, g, b, a);
}

function colorToRGB(val) {
    return val instanceof RGBA
        ? val
        : val.startsWith("#")
        ? hexToRgb(val)
        : val.startsWith("rgb")
        ? rgbParse(val)
        : val.startsWith("hsl")
        ? hslParse(val)
        : {
              r: 0,
              g: 0,
              b: 0,
              a: 255,
          };
}

function colorRGBtransition(src, dest) {
    src = src || defaultColor;
    dest = dest || defaultColor;
    src = colorToRGB(src);
    dest = colorToRGB(dest);
    return function trans(f) {
        return new RGBA(
            round(src.r + (dest.r - src.r) * f),
            round(src.g + (dest.g - src.g) * f),
            round(src.b + (dest.b - src.b) * f),
            round(src.a + (dest.a - src.a) * f)
        );
    };
}

function rgbaInstance(r, g, b, a) {
    return new RGBA(r, g, b, a);
}

function isTypeColor(value) {
    return (
        value instanceof RGBA ||
        value.startsWith("#") ||
        value.startsWith("rgb") ||
        value.startsWith("hsl")
    );
}

export default {
    nameToHex: nameToHex,
    hexToRgb: hexToRgb,
    rgbToHex: rgbToHex,
    hslToRgb: hslParse,
    transition: colorRGBtransition,
    colorToRGB: colorToRGB,
    rgba: rgbaInstance,
    isTypeColor: isTypeColor,
    RGBAInstanceCheck: function (_) {
        return _ instanceof RGBA;
    },
};
