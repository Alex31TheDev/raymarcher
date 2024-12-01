import fs from "fs";

import "./cycdraw/patches.js";

import Image from "./cycdraw/Image.js";

import Utils from "./cycdraw/util/Utils.js";
import Benchmark from "./cycdraw/util/Benchmark.js";

import DrawingError from "./cycdraw/errors/DrawingError.js";

import { ctxNames, ctxVars } from "./cycdraw/context.js";

import config from "./config.js";
const { imgConfig, pathConfig, frameCount } = config;

function createImage(frame) {
    Benchmark.startTiming(`create_img_${frame + 1}`);

    const { w, h } = imgConfig;
    let img = new Image(w, h);

    Benchmark.stopTiming(`create_img_${frame + 1}`);
    return img;
}

function runScript(img, script, inVars) {
    let vars = Array.from(ctxVars);

    for (const [key, value] of Object.entries(inVars)) {
        const ind = ctxNames.indexOf(key);

        if (ind === -1) {
            throw new DrawingError("Variable not found: " + key);
        }

        vars.splice(ind, 0, value);
    }

    img = Function(...ctxNames, script).apply(undefined, vars);
    return img;
}

function drawImg(frame, script) {
    let img = createImage(frame);

    Benchmark.startTiming(`draw_img_${frame + 1}`);

    const vars = {
        img,
        frame
    };

    img = runScript(img, script, vars);

    Benchmark.stopTiming(`draw_img_${frame + 1}`);

    return img;
}

function writeMessage(frame) {
    if (frameCount === 1) {
        console.log("Generating frame...");
        return;
    }

    console.log(`Generating frame ${frame + 1}...`);
}

function writeImg() {
    Benchmark.startTiming("total");
    Benchmark.startTiming("read_script");

    const script = Utils.readScript(pathConfig.scriptPath);

    Benchmark.stopTiming("read_script");
    Benchmark.startTiming("gen_frames");

    for (let frame = 0; frame < frameCount; frame++) {
        writeMessage(frame);
        const img = drawImg(frame, script);

        Benchmark.startTiming(`encode_img_${frame + 1}`);

        let buf = img.encode();

        Benchmark.stopTiming(`encode_img_${frame + 1}`);
        Benchmark.startTiming(`write_file_${frame + 1}`);

        const outPath = Utils.getOutPath(pathConfig.outPath, frame);
        Utils.makeFolders(pathConfig.outPath);
        fs.writeFileSync(outPath, buf);

        Benchmark.stopTiming(`write_file_${frame + 1}`);
    }

    Benchmark.stopTiming("gen_frames");
    Benchmark.stopTiming("total");

    console.log("\nBenchmark times:\n\n" + Benchmark.getAll());
}

writeImg();
console.log();
