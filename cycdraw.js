import fs from "fs";

import "./cycdraw/patches.js";

import Image from "./cycdraw/Image.js";

import Utils from "./cycdraw/util/Utils.js";
import Benchmark from "./cycdraw/util/Benchmark.js";

import DrawingError from "./cycdraw/errors/DrawingError.js";

import { ctxNames, ctxVars } from "./cycdraw/context.js";

import config from "./config.js";
const { imgConfig, pathConfig, frameCount } = config;

function createImage(idx) {
    Benchmark.startTiming("create_img_" + idx);

    const { w, h } = imgConfig;
    let img = new Image(w, h);

    Benchmark.stopTiming("create_img_" + idx);

    return img;
}

function runScript(img, script, inVars) {
    let vars = Array.from(ctxVars);

    for (const [key, value] of Object.entries(inVars)) {
        const idx = ctxNames.indexOf(key);

        if (idx === -1) {
            throw new DrawingError("Variable not found: " + key);
        }

        vars.splice(idx, 0, value);
    }

    img = Function(...ctxNames, script).apply(undefined, vars);
    return img;
}

function drawImg(idx, script) {
    let img = createImage(idx);

    Benchmark.startTiming("draw_img_" + idx);

    const vars = {
        img,
        idx
    };

    img = runScript(img, script, vars);

    Benchmark.stopTiming("draw_img_" + idx);

    return img;
}

function writeMessage(idx) {
    if (frameCount === 1) {
        console.log("Generating frame...");
        return;
    }

    console.log(`Generating frame ${idx + 1}...`);
}

function writeImg() {
    Benchmark.startTiming("total");
    Benchmark.startTiming("read_script");

    const script = Utils.readScript(pathConfig.scriptPath);

    Benchmark.stopTiming("read_script");
    Benchmark.startTiming("gen_frames");

    for (let idx = 0; idx < frameCount; idx++) {
        writeMessage(idx);
        const img = drawImg(idx, script);

        Benchmark.startTiming("encode_img_" + idx);

        let buf = img.encode();

        Benchmark.stopTiming("encode_img_" + idx);
        Benchmark.startTiming("write_file_" + idx);

        const outPath = Utils.getOutPath(pathConfig.outPath, idx);
        fs.writeFileSync(outPath, buf);

        Benchmark.stopTiming("write_file_" + idx);
    }

    Benchmark.stopTiming("gen_frames");
    Benchmark.stopTiming("total");

    console.log("\nBenchmark times:\n\n" + Benchmark.getAll() + "\n");
}

writeImg();
console.log();
