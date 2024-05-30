import zlib from "zlib";

import ChunkPNG from "./ChunkPNG.js";
import DataTypes from "./DataTypes.js";

import CRC32 from "./CRC32.js";
import Benchmark from "../util/Benchmark.js";

import EncoderError from "../errors/EncoderError.js";

class EncoderPNG {
    static signature = "\x89PNG\x0d\x0a\x1a\x0a";
    static idatFlags = "\x08\x02\x00\x00\x00";

    constructor(pixels, w, h) {
        if (!(pixels instanceof Uint8Array)) {
            throw new EncoderError("Invalid pixel array type");
        }

        if (pixels.length !== 3 * w * h) {
            throw new EncoderError("Pixel array size invalid");
        }

        this.pixels = pixels;

        this.w = w;
        this.h = h;

        this.offset = 0;
        this.chunks = [];
    }

    filterPixels() {
        Benchmark.startTiming("enc_filter");
        const buf = Buffer.alloc(this.pixels.length + this.h);

        for (let y = 0; y < this.h; y++) {
            buf[y * this.w * 3 + y] = 1;

            for (let x = 0; x < this.w; x++) {
                let pos = 3 * (y * this.w + x);
                let pos_b = pos + y;
                let r_f, g_f, b_f;

                if (x === 0) {
                    r_f = this.pixels[pos];
                    g_f = this.pixels[pos + 1];
                    b_f = this.pixels[pos + 2];
                } else {
                    r_f = this.pixels[pos] - this.pixels[pos - 3];
                    g_f = this.pixels[pos + 1] - this.pixels[pos - 2];
                    b_f = this.pixels[pos + 2] - this.pixels[pos - 1];
                }

                buf[pos_b + 1] = r_f;
                buf[pos_b + 2] = g_f;
                buf[pos_b + 3] = b_f;
            }
        }

        Benchmark.stopTiming("enc_filter");
        this.pixels = buf;
    }

    compressPixels() {
        Benchmark.startTiming("enc_compress");

        const buf = zlib.deflateSync(this.pixels);

        const off = buf.byteOffset,
            len = buf.byteLength / Uint8Array.BYTES_PER_ELEMENT;

        this.pixels = new Uint8Array(buf.buffer, off, len);

        Benchmark.stopTiming("enc_compress");
    }

    getChunksSize() {
        let size = 0;
        this.sizes = Array(this.chunks.length);

        for (let i = 0; i < this.chunks.length; i++) {
            const chunkSize = this.chunks[i].getSize();

            size += chunkSize;
            this.sizes[i] = chunkSize;
        }

        return size;
    }

    writeChunks() {
        for (let i = 0; i < this.chunks.length; i++) {
            const chunk = this.chunks[i],
                size = this.sizes[i];

            this.buf.writeUInt32BE(size - 12, this.offset);
            this.buf.write(chunk.name, this.offset + 4, "ascii");
            this.offset += 8;

            for (let j = 0; j < chunk.data.length && size > 0; j++) {
                switch (chunk.types[j]) {
                    case DataTypes.UInt32BE:
                        this.buf.writeUInt32BE(chunk.data[j], this.offset);
                        this.offset += 4;
                        break;
                    case DataTypes.string:
                        this.buf.write(chunk.data[j], this.offset, "ascii");
                        this.offset += chunk.data[j].length;
                        break;
                    case DataTypes.buf:
                        this.buf.blit(chunk.data[j], this.offset, 0, chunk.data[j].length);
                        this.offset += chunk.data[j].length;
                        break;
                    case DataTypes.byte:
                        this.buf[this.offset++] = chunk.data[j];
                        break;
                }
            }

            this.writeChecksum(this.offset - size + 8, this.offset);
            this.offset += 4;
        }
    }

    writeChecksum(start, end) {
        const crc = new CRC32().calculate(this.buf, start, end);

        this.buf.writeUInt32BE(crc, end);
    }

    writeSignature() {
        const sigSize = EncoderPNG.signature.length;

        this.buf.write(EncoderPNG.signature, 0, "ascii");
        this.offset += sigSize;
    }

    createBuffer() {
        const sigSize = EncoderPNG.signature.length;
        this.buf = Buffer.alloc(this.getChunksSize() + sigSize);
    }

    addChunks() {
        const ihdr = new ChunkPNG("IHDR");
        ihdr.addData(this.w, DataTypes.UInt32BE);
        ihdr.addData(this.h, DataTypes.UInt32BE);
        ihdr.addData(EncoderPNG.idatFlags, DataTypes.string);

        const idat = new ChunkPNG("IDAT");
        idat.addData(this.pixels, DataTypes.buf);

        const iend = new ChunkPNG("IEND");

        this.chunks.push(ihdr);
        this.chunks.push(idat);
        this.chunks.push(iend);
    }

    encode() {
        this.filterPixels();
        this.compressPixels();

        this.addChunks();

        this.createBuffer();

        this.writeSignature();
        this.writeChunks();

        return this.buf;
    }
}

export default EncoderPNG;
