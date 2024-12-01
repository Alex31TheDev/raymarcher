import EncoderPNG from "./encoder/EncoderPNG.js";

import Utils from "./util/Utils.js";
import DrawingError from "./errors/DrawingError.js";

class Image {
    constructor(w, h) {
        if (w <= 0 || h <= 0 || w > 1920 || h > 1080) {
            throw new DrawingError("Invalid image size");
        }

        this.w = Math.floor(w);
        this.h = Math.floor(h);

        this.pixels = new Uint8Array(w * h * 3).fill(0);
    }

    static fromArray(pixels, w, h) {
        if (pixels.length % 3 !== 0) {
            throw new DrawingError("Pixel array is invalid");
        }

        if (pixels.length > w * h * 3) {
            throw new DrawingError("Pixel array is too large");
        }

        let img = new Image(w, h),
            i = 0;

        for (; i < pixels.length; i++) {
            img.pixels[i] = pixels[i] & 0xff;
        }

        return img;
    }

    encode() {
        const encoder = new EncoderPNG(this.pixels, this.w, this.h);
        return encoder.encode();
    }

    inBounds(x, y) {
        return x >= 0 && x < this.w && y >= 0 && y < this.h;
    }

    clamp(x, y) {
        x = Utils.clamp(Math.floor(x), 0, this.w);
        y = Utils.clamp(Math.floor(y), 0, this.h);

        return [x, y];
    }

    _clampLiangBarsky(x0src, y0src, x1src, y1src) {
        if (this.inBounds(x0src, y0src) && this.inBounds(x1src, y1src)) {
            return [Math.floor(x0src), Math.floor(y0src), Math.floor(x1src), Math.floor(y1src)];
        }

        const edgeLeft = 0,
            edgeRight = this.w,
            edgeBottom = 0,
            edgeTop = this.h;

        const xdelta = x1src - x0src,
            ydelta = y1src - y0src;

        let t0 = 0.0,
            t1 = 1.0;

        let p, q, r;

        for (let edge = 0; edge < 4; edge++) {
            switch (edge) {
                case 0:
                    p = -xdelta;
                    q = -(edgeLeft - x0src);
                    break;
                case 1:
                    p = xdelta;
                    q = edgeRight - x0src;
                    break;
                case 2:
                    p = -ydelta;
                    q = -(edgeBottom - y0src);
                    break;
                case 3:
                    p = ydelta;
                    q = edgeTop - y0src;
                    break;
            }

            r = q / p;

            if (p === 0 && q < 0) {
                return false;
            }

            if (p < 0) {
                if (r > t1) {
                    return false;
                } else if (r > t0) {
                    t0 = r;
                }
            } else if (p > 0) {
                if (r < t0) {
                    return false;
                } else if (r < t1) {
                    t1 = r;
                }
            }
        }

        const x0clip = Math.floor(x0src + t0 * xdelta),
            y0clip = Math.floor(y0src + t0 * ydelta),
            x1clip = Math.floor(x0src + t1 * xdelta),
            y1clip = Math.floor(y0src + t1 * ydelta);

        return [x0clip, y0clip, x1clip, y1clip];
    }

    getPixel(x, y) {
        x = Math.floor(x);
        y = Math.floor(y);

        if (!this.inBounds(x, y)) {
            return Colors.black;
        }

        const pos = 3 * (y * this.w + x);

        const r = this.pixels[pos],
            g = this.pixels[pos + 1],
            b = this.pixels[pos + 2];

        return new Color(r, g, b);
    }

    setPixel(x, y, color) {
        x = Math.floor(x);
        y = Math.floor(y);

        if (!this.inBounds(x, y)) {
            return;
        }

        this.setPixel_u(x, y, color);
    }

    setPixel_u(x, y, color) {
        let pos = 3 * (y * this.w + x);

        this.pixels[pos++] = color.r;
        this.pixels[pos++] = color.g;
        this.pixels[pos] = color.b;
    }

    setPixel_u_rgb(x, y, r, g, b) {
        let pos = 3 * (y * this.w + x);

        this.pixels[pos++] = r;
        this.pixels[pos++] = g;
        this.pixels[pos] = b;
    }

    clear(color) {
        let i = 0;

        while (i < this.pixels.length) {
            this.pixels[i++] = color.r;
            this.pixels[i++] = color.g;
            this.pixels[i++] = color.b;
        }
    }

    flipHorizontal() {
        const w = this.w / 2,
            yi = 3 * (this.w - 1);

        let x = 0,
            y,
            tmp;

        let pos1 = 0,
            pos2 = 3 * (this.w - 1);

        for (; x < w; x++) {
            for (y = 0; y < this.h; y++) {
                tmp = this.pixels[pos1];
                this.pixels[pos1++] = this.pixels[pos2];
                this.pixels[pos2++] = tmp;

                tmp = this.pixels[pos1];
                this.pixels[pos1++] = this.pixels[pos2];
                this.pixels[pos2++] = tmp;

                tmp = this.pixels[pos1];
                this.pixels[pos1++] = this.pixels[pos2];
                this.pixels[pos2++] = tmp;

                pos1 += yi;
                pos2 += yi;
            }

            pos1 = 3 * x;
            pos2 = 3 * (this.w - x - 2);
        }
    }

    flipVertical() {
        const w = 3 * this.w,
            h = this.h / 2,
            yi = -2 * w;

        let y = 0,
            x,
            tmp;

        let pos1 = 0,
            pos2 = this.pixels.length - 3 * this.w;

        for (; y < h; y++) {
            for (x = 0; x < w; x++) {
                tmp = this.pixels[pos1];
                this.pixels[pos1++] = this.pixels[pos2];
                this.pixels[pos2++] = tmp;
            }

            pos2 += yi;
        }
    }

    rotate180() {
        let pos1 = 0,
            pos2 = this.pixels.length - 3;

        let max = this.pixels.length / 2,
            tmp;

        while (pos1 < max) {
            tmp = this.pixels[pos1];
            this.pixels[pos1++] = this.pixels[pos2];
            this.pixels[pos2++] = tmp;

            tmp = this.pixels[pos1];
            this.pixels[pos1++] = this.pixels[pos2];
            this.pixels[pos2++] = tmp;

            tmp = this.pixels[pos1];
            this.pixels[pos1++] = this.pixels[pos2];
            this.pixels[pos2++] = tmp;

            pos2 -= 6;
        }
    }

    rotate90(direction) {
        const pixels2 = new Uint8Array(this.w * this.h * 3);

        switch (direction) {
            case 0:
                {
                    const yi = 3 * (this.h - 1);

                    let y = 0,
                        x;

                    let pos1 = 0,
                        pos2 = 0;

                    for (; y < this.h; y++) {
                        for (x = 0; x < this.w; x++) {
                            pixels2[pos2++] = this.pixels[pos1++];
                            pixels2[pos2++] = this.pixels[pos1++];
                            pixels2[pos2++] = this.pixels[pos1++];

                            pos2 += yi;
                        }

                        pos2 = 3 * (this.h - y - 2);
                    }
                }
                break;
            case 1:
                {
                    const yi = -3 * (this.h + 1);

                    let y = 0,
                        x;

                    let pos1 = 0,
                        pos2 = this.pixels.length - 3 * this.h;

                    for (; y < this.h; y++) {
                        for (x = 0; x < this.w; x++) {
                            pixels2[pos2++] = this.pixels[pos1++];
                            pixels2[pos2++] = this.pixels[pos1++];
                            pixels2[pos2++] = this.pixels[pos1++];

                            pos2 += yi;
                        }

                        pos2 = this.pixels.length - 3 * (this.h - y - 1);
                    }
                }
                break;
            default:
                return;
        }

        let tmp = this.w;
        this.w = this.h;
        this.h = tmp;

        this.pixels = pixels2;
    }

    fill(x1, y1, x2, y2, color) {
        if ((x1 < 0 && x2 < 0) || (x1 > this.w && x2 > this.w) || (y1 < 0 && y2 < 0) || (y1 > this.h && y2 > this.h)) {
            return;
        }

        [x1, y1] = this.clamp(x1, y1);
        [x2, y2] = this.clamp(x2, y2);

        if (x2 < x1) {
            let tmp = x1;
            x1 = x2;
            x2 = tmp;
        }

        if (y2 < y1) {
            let tmp = y1;
            y1 = y2;
            y2 = tmp;
        }

        const w = Math.abs(x2 - x1),
            h = Math.abs(y2 - y1);

        if (w === 0 && h === 0) {
            this.setPixel_u(x1, y1, color);
        } else if (h === 0) {
            let pos1 = 3 * (y1 * this.w + x1),
                pos2 = 3 * (y2 * this.w + x2);

            while (pos1 < pos2) {
                this.pixels[pos1++] = color.r;
                this.pixels[pos1++] = color.g;
                this.pixels[pos1++] = color.b;
            }
        } else if (w === 0) {
            const yi = 3 * (this.w - 1);

            let pos1 = 3 * (y1 * this.w + x1),
                pos2 = 3 * (y2 * this.w + x2);

            while (pos1 < pos2) {
                this.pixels[pos1++] = color.r;
                this.pixels[pos1++] = color.g;
                this.pixels[pos1++] = color.b;

                pos1 += yi;
            }
        } else {
            const yi = -3 * (w - this.w);

            let i = 0,
                j;

            let pos = 3 * (y1 * this.w + x1);

            for (; i < h; i++) {
                for (j = 0; j < w; j++) {
                    this.pixels[pos++] = color.r;
                    this.pixels[pos++] = color.g;
                    this.pixels[pos++] = color.b;
                }

                pos += yi;
            }
        }
    }

    blit(x, y, src, w, h) {
        let sw = Math.min(w, src.w) || src.w,
            sh = Math.min(h, src.h) || src.h;

        if (sw + x >= this.w) {
            sw = this.w - x;
        }
        if (sh + y >= this.h) {
            sh = this.h - y;
        }

        let i = 0,
            j;

        for (; i < sw; i++) {
            for (j = 0; j < sh; j++) {
                const pos1 = 3 * ((j + y) * this.w + i + x),
                    pos2 = 3 * (j * src.w + i);

                this.pixels[pos1] = src.pixels[pos2];
                this.pixels[pos1 + 1] = src.pixels[pos2 + 1];
                this.pixels[pos1 + 2] = src.pixels[pos2 + 2];
            }
        }
    }

    invert() {
        let i = 0;

        for (; i < this.pixels.length; i++) {
            this.pixels[i] = 255 - this.pixels[i];
        }
    }

    removeChannel(channel) {
        let i = 0;

        switch (channel) {
            case "r":
                break;
            case "g":
                i = 1;
                break;
            case "b":
                i = 2;
                break;
            default:
                return;
        }

        for (; i < this.pixels.length; i += 3) {
            this.pixels[i] = 0;
        }
    }

    fillRadius(x, y, color, r) {
        if (!this.inBounds(x + r, y + r) && !this.inBounds(x - r, y - r)) {
            return;
        }

        r = Math.floor(r);

        if (r === 0) {
            this.setPixel(x, y, color);
            return;
        }

        const x1 = Math.max(0, x - r),
            y1 = Math.max(0, y - r);

        let w = 2 * r,
            h = 2 * r;

        if (x1 + w > this.w) {
            w = this.w - x1;
        }

        if (y1 + h > this.h) {
            h = this.h - y1;
        }

        const yi = -3 * (w - this.w + 1);

        let i = 0,
            j;

        let pos = 3 * (y1 * this.w + x1);

        for (; i <= h; i++) {
            for (j = 0; j <= w; j++) {
                this.pixels[pos++] = color.r;
                this.pixels[pos++] = color.g;
                this.pixels[pos++] = color.b;
            }

            pos += yi;
        }
    }

    drawLine(x1, y1, x2, y2, color) {
        if (x1 === x2 && y1 === y2) {
            this.setPixel_u(x1, y1, color);
            return;
        }

        const coords = this._clampLiangBarsky(x1, y1, x2, y2);

        if (!coords) {
            return;
        }

        [x1, y1, x2, y2] = coords;

        let dx = x2 - x1,
            dy = y2 - y1;

        if (dx === 0 && dy === 0) {
            this.setPixel_u(x1, y1, color);
        } else if (dy === 0) {
            let pos1 = 3 * (y1 * this.w + x1),
                pos2 = 3 * (y2 * this.w + x2);

            if (pos1 > pos2) {
                let tmp = pos1;
                pos1 = pos2;
                pos2 = tmp;
            }

            while (pos1 < pos2) {
                this.pixels[pos1++] = color.r;
                this.pixels[pos1++] = color.g;
                this.pixels[pos1++] = color.b;
            }
        } else if (dx === 0) {
            const yi = 3 * (this.w - 1);

            let pos1 = 3 * (y1 * this.w + x1),
                pos2 = 3 * (y2 * this.w + x2);

            if (pos1 > pos2) {
                let tmp = pos1;
                pos1 = pos2;
                pos2 = tmp;
            }

            while (pos1 < pos2) {
                this.pixels[pos1++] = color.r;
                this.pixels[pos1++] = color.g;
                this.pixels[pos1++] = color.b;

                pos1 += yi;
            }
        } else if (Math.abs(dy) < Math.abs(dx)) {
            if (x1 > x2) {
                let tmp = x2;
                x2 = x1;
                x1 = tmp;

                tmp = y2;
                y2 = y1;
                y1 = tmp;

                dx = -dx;
                dy = -dy;
            }

            let yi = 3 * this.w;

            if (dy < 0) {
                yi = -yi;
                dy = -dy;
            }

            let err = 2 * dy - dx,
                derr1 = -2 * dx,
                derr2 = 2 * dy;

            let pos = 3 * (y1 * this.w + x1);

            for (; x1 <= x2; x1++) {
                this.pixels[pos++] = color.r;
                this.pixels[pos++] = color.g;
                this.pixels[pos++] = color.b;

                if (err >= 0) {
                    pos += yi;
                    err += derr1;
                }

                err += derr2;
            }
        } else {
            if (y1 > y2) {
                let tmp = x2;
                x2 = x1;
                x1 = tmp;

                tmp = y2;
                y2 = y1;
                y1 = tmp;

                dx = -dx;
                dy = -dy;
            }

            let xi = 3,
                yi = 3 * (this.w - 1);

            if (dx < 0) {
                xi = -xi;
                dx = -dx;
            }

            let err = 2 * dx - dy,
                derr1 = -2 * dy,
                derr2 = 2 * dx;

            let pos = 3 * (y1 * this.w + x1);

            for (; y1 <= y2; y1++) {
                this.pixels[pos++] = color.r;
                this.pixels[pos++] = color.g;
                this.pixels[pos++] = color.b;

                if (err >= 0) {
                    pos += xi;
                    err += derr1;
                }

                err += derr2;
                pos += yi;
            }
        }
    }

    drawGrid(grid, color) {
        for (let i = 0; i <= grid.xDiv; i++) {
            let x1, y2;

            for (let j = 0; j < grid.yDiv; j++) {
                x1 = grid.x + i * grid.xMult;

                const y1 = grid.y + j * grid.yMult;
                y2 = grid.y + (j + 1) * grid.yMult - 1;

                this.drawLine(x1, y1, x1, y2, color);
            }

            if (i !== grid.xDiv) {
                for (let j = 0; j <= grid.yDiv; j++) {
                    const x2 = grid.x + i * grid.xMult + 1,
                        y1 = grid.y + j * grid.yMult,
                        x3 = grid.x + (i + 1) * grid.xMult - 1;

                    this.drawLine(x2, y1, x3, y1, color);
                }
            }

            this.setPixel(x1, y2 + 1, color);
        }
    }

    drawPoints(points, color, size) {
        if (points.length % 2 !== 0) {
            throw new DrawingError("Invalid points array");
        }

        let pixel = this.setPixel;
        if (size) {
            pixel = this.fillRadius;
        }

        pixel = pixel.bind(this);

        for (let i = 0; i < points.length; i += 2) {
            pixel(points[i], points[i + 1], color, size);
        }
    }

    _circlePoints(xc, yc, x, y) {
        this.setPixel(xc + x, yc + y, color);
        this.setPixel(xc - x, yc + y, color);
        this.setPixel(xc + x, yc - y, color);
        this.setPixel(xc - x, yc - y, color);
        this.setPixel(xc + y, yc + x, color);
        this.setPixel(xc - y, yc + x, color);
        this.setPixel(xc + y, yc - x, color);
        this.setPixel(xc - y, yc - x, color);
    }

    drawCircle(xc, yc, r, color) {
        let x = 0,
            y = r,
            d = 3 - 2 * r;

        this._circlePoints(xc, yc, x, y, color);

        while (y >= x) {
            x++;
            if (d > 0) {
                y--;
                d = d + 4 * (x - y) + 10;
            } else {
                d = d + 4 * x + 6;
            }

            circlePoints(xc, yc, x, y, color);
        }
    }

    drawString(x, y, str, font) {
        let x_of = 0;

        for (let i = 0; i < str.length; i++) {
            const char = str[i];

            if (char === "\n") {
                continue;
            }

            const glyph = font.getGlyph(char);
            this.blit(x + x_of, y, glyph);

            x_of += glyph.w + font.spacing;
        }
    }
}

export default Image;
