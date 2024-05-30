Buffer.prototype.blit = function (src, offset, start, length) {
    if (offset >= this.length || start >= src.length) {
        return;
    }

    if (length + offset >= this.length || length + start >= src.length) {
        length = Math.min(this.length - offset, src.length - start);
    }

    for (let i = 0; i < length; i++) {
        this[i + offset] = src[i + start] & 0xff;
    }
};
