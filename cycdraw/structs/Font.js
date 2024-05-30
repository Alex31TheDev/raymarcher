import Image from "../Image.js";

class Font {
    constructor(charSet, spacing = 0, postProc) {
        this.spacing = spacing;
        this.loadGlyphs(charSet);

        if (typeof postProc !== "undefined") {
            const glyphs = this.charSet.map(x => this.charMap[x]);
            glyphs.forEach(postProc);

            postProc(this.unknown);
        }
    }

    loadGlyphs(charSet) {
        this.charSet = Object.keys(charSet);
        this.charMap = {};

        this.unknown = undefined;

        for (const key of Object.keys(charSet)) {
            const char = charSet[key],
                glyph = Image.fromArray(char.pixels, char.w, char.h);

            if (key === "unknown") {
                this.unknown = glyph;

                const ind = this.charSet.indexOf(key);
                this.charSet.splice(ind, 1);
            } else {
                this.charMap[key] = glyph;
            }
        }

        if (typeof this.unknown === "undefined") {
            this.unknown = new Image(1, 1);
        }
    }

    getGlyph(char) {
        if (this.charSet.includes(char)) {
            return this.charMap[char];
        }

        return this.unknown;
    }
}

export default Font;
