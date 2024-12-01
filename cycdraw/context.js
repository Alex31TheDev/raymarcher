import Image from "./Image.js";
import Color from "./structs/Color.js";
import Colors from "./collections/Colors.js";
import Point from "./structs/Point.js";
import Grid from "./structs/Grid.js";
import Font from "./structs/Font.js";
import Benchmark from "./util/Benchmark.js";
import DigitFont from "./collections/DigitFont.js";
import Utils from "./util/Utils.js";

// prettier-ignore
const ctxNames = [
    "img",
    "frame",

    "Image",

    "Color",
    "Point",
    "Grid",
    "Font",

    "Colors",
    "DigitFont",

    "Benchmark",
    "Utils"
];

// prettier-ignore
const ctxVars = [
    Image,

    Color,
    Point,
    Grid,
    Font,

    Colors,
    DigitFont,

    Benchmark,
    Utils
];

export { ctxNames, ctxVars };
