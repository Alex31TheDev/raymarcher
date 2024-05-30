import fs from "fs";
import path from "path";

import Codegen from "./Codegen.js";

const Utils = {
    getOutPath: (filePath, idx) => {
        const parsed = path.parse(filePath);

        const newName = parsed.name + (idx + 1).toString(),
            newPath = path.join(parsed.dir, newName + parsed.ext);

        return newPath;
    },

    readScript: filePath => {
        let script = fs.readFileSync(filePath, {
            encoding: "utf-8"
        });

        script = Codegen.wrapScript(script);

        return script;
    },

    makeFolders: filePath => {
        const dirPath = path.dirname(filePath);

        try {
            fs.accessSync(dirPath);
            return false;
        } catch (err) {
            fs.mkdirSync(dirPath, {
                recursive: true
            });
        }

        return true;
    },

    capitalize: str => {
        return str[0].toUpperCase() + str.substring(1);
    },

    clamp: (x, a, b) => {
        return Math.max(Math.min(x, b), a);
    },

    round: (num, digits) => {
        return Math.round((num + Number.EPSILON) * 10 ** digits) / 10 ** digits;
    },

    randomElement: (arr, a = 0, b = arr.length) => {
        return arr[a + ~~(Math.random() * (b - a))];
    },

    urlRegex: /\w+?:\/\/(.+\.)?[\w|\d]+\.\w+\/?.*/,
    validUrl: url => {
        return Util.urlRegex.test(url);
    },

    splitAt: (str, sep = " ") => {
        const ind = str.indexOf(sep);

        let first, second;

        if (ind === -1) {
            first = str;
            second = "";
        } else {
            first = str.slice(0, ind);
            second = str.slice(ind);
        }

        return [first, second];
    },

    formatOutput: out => {
        if (out === null) {
            return undefined;
        }

        if (Array.isArray(out)) {
            return out.join(", ");
        }

        switch (typeof out) {
            case "bigint":
            case "boolean":
            case "number":
                return out.toString();
            case "function":
            case "symbol":
                return undefined;
            case "object":
                try {
                    return JSON.stringify(out);
                } catch (err) {
                    return undefined;
                }
            default:
                return out;
        }
    }
};

export default Utils;
