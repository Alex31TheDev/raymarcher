import Color from "../structs/Color.js";

const Colors = Object.freeze({
    // basic colors

    aqua: new Color(0, 255, 255),
    beige: new Color(245, 245, 220),
    black: new Color(0, 0, 0),
    blue: new Color(0, 0, 255),
    brown: new Color(165, 42, 42),
    crimson: new Color(220, 20, 60),
    cyan: new Color(0, 255, 255),
    darkBlue: new Color(0, 0, 139),
    darkCyan: new Color(0, 139, 139),
    darkGray: new Color(169, 169, 169),
    darkGreen: new Color(0, 100, 0),
    darkOrange: new Color(255, 140, 0),
    darkRed: new Color(139, 0, 0),
    deepPink: new Color(255, 20, 147),
    gold: new Color(255, 215, 0),
    gray: new Color(128, 128, 128),
    green: new Color(0, 128, 0),
    hotPink: new Color(255, 105, 180),
    indigo: new Color(75, 0, 130),
    lightBlue: new Color(100, 149, 237),
    lightBlue: new Color(173, 216, 230),
    lightCyan: new Color(224, 255, 255),
    lightGray: new Color(211, 211, 211),
    lightGreen: new Color(144, 238, 144),
    lightPink: new Color(255, 182, 193),
    lightYellow: new Color(255, 255, 224),
    lime: new Color(0, 255, 0),
    magenta: new Color(255, 0, 255),
    olive: new Color(128, 128, 0),
    orange: new Color(255, 165, 0),
    orangeRed: new Color(255, 69, 0),
    pink: new Color(255, 192, 203),
    purple: new Color(147, 112, 219),
    red: new Color(255, 0, 0),
    silver: new Color(192, 192, 192),
    tan: new Color(210, 180, 140),
    violet: new Color(138, 43, 226),
    white: new Color(255, 255, 255),
    yellow: new Color(255, 255, 0),

    // additional colors

    aliceBlue: new Color(240, 248, 255),
    antiqueWhite: new Color(250, 235, 215),
    aquamarine: new Color(127, 255, 212),
    azure: new Color(240, 255, 255),
    bisque: new Color(255, 228, 196),
    blanchedAlmond: new Color(255, 235, 205),
    blueViolet: new Color(138, 43, 226),
    burlyWood: new Color(222, 184, 135),
    cadetBlue: new Color(95, 158, 160),
    chartreuse: new Color(127, 255, 0),
    chocolate: new Color(210, 105, 30),
    coral: new Color(255, 127, 80),
    cornflowerBlue: new Color(100, 149, 237),
    cornsilk: new Color(255, 248, 220),
    darkGoldenRod: new Color(184, 134, 11),
    darkKhaki: new Color(189, 183, 107),
    darkMagenta: new Color(139, 0, 139),
    darkOliveGreen: new Color(85, 107, 47),
    darkOrchid: new Color(153, 50, 204),
    darkSalmon: new Color(233, 150, 122),
    darkSeaGreen: new Color(143, 188, 143),
    darkSlateBlue: new Color(72, 61, 139),
    darkSlateGray: new Color(47, 79, 79),
    darkTurquoise: new Color(0, 206, 209),
    darkViolet: new Color(148, 0, 211),
    deepSkyBlue: new Color(0, 191, 255),
    dimGray: new Color(105, 105, 105),
    dodgerBlue: new Color(30, 144, 255),
    fireBrick: new Color(178, 34, 34),
    floralWhite: new Color(255, 250, 240),
    forestGreen: new Color(34, 139, 34),
    fuchsia: new Color(255, 0, 255),
    gainsboro: new Color(220, 220, 220),
    ghostWhite: new Color(248, 248, 255),
    greenYellow: new Color(173, 255, 47),
    honeyDew: new Color(240, 255, 240),
    indianRed: new Color(205, 92, 92),
    ivory: new Color(255, 255, 240),
    khaki: new Color(240, 230, 140),
    lavender: new Color(230, 230, 250),
    lavenderBlush: new Color(255, 240, 245),
    lawnGreen: new Color(124, 252, 0),
    lemonChiffon: new Color(255, 250, 205),
    lightCoral: new Color(240, 128, 128),
    lightGoldenRodYellow: new Color(250, 250, 210),
    lightSalmon: new Color(255, 160, 122),
    lightSeaGreen: new Color(32, 178, 170),
    lightSkyBlue: new Color(135, 206, 250),
    lightSlateGray: new Color(119, 136, 153),
    lightSteelBlue: new Color(176, 196, 222),
    limeGreen: new Color(50, 205, 50),
    linen: new Color(250, 240, 230),
    mediumAquaMarine: new Color(102, 205, 170),
    mediumBlue: new Color(0, 0, 205),
    mediumOrchid: new Color(186, 85, 211),
    mediumPurple: new Color(147, 112, 219),
    mediumSeaGreen: new Color(60, 179, 113),
    mediumSlateBlue: new Color(123, 104, 238),
    mediumSpringGreen: new Color(0, 250, 154),
    mediumTurquoise: new Color(72, 209, 204),
    mediumVioletRed: new Color(199, 21, 133),
    midnightBlue: new Color(25, 25, 112),
    mintCream: new Color(245, 255, 250),
    mistyRose: new Color(255, 228, 225),
    moccasin: new Color(255, 228, 181),
    navajoWhite: new Color(255, 222, 173),
    oldLace: new Color(253, 245, 230),
    paleGoldenRod: new Color(238, 232, 170),
    paleGreen: new Color(152, 251, 152),
    paleTurquoise: new Color(175, 238, 238),
    paleVioletRed: new Color(219, 112, 147),
    papayaWhip: new Color(255, 239, 213),
    peachPuff: new Color(255, 218, 185),
    peru: new Color(205, 133, 63),
    plum: new Color(221, 160, 221),
    powderBlue: new Color(176, 224, 230),
    rosyBrown: new Color(188, 143, 143),
    royalBlue: new Color(65, 105, 225),
    saddleBrown: new Color(139, 69, 19),
    salmon: new Color(250, 128, 114),
    sandyBrown: new Color(244, 164, 96),
    seaGreen: new Color(46, 139, 87),
    seaShell: new Color(255, 245, 238),
    sienna: new Color(160, 82, 45),
    skyBlue: new Color(135, 206, 235),
    slateBlue: new Color(106, 90, 205),
    slateGray: new Color(112, 128, 144),
    snow: new Color(255, 250, 250),
    springGreen: new Color(0, 255, 127),
    steelBlue: new Color(70, 130, 180),
    teal: new Color(0, 128, 128),
    thistle: new Color(216, 191, 216),
    tomato: new Color(255, 99, 71),
    turquoise: new Color(64, 224, 208),
    wheat: new Color(245, 222, 179),
    yellowGreen: new Color(154, 205, 50)
});

export default Colors;
