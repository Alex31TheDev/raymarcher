import DataTypes from "./DataTypes.js";

class ChunkPNG {
    constructor(name) {
        if (typeof name !== "string" || name.length !== 4) {
            throw new EncoderError("Invalid chunk name");
        }

        this.name = name;

        this.data = [];
        this.types = [];
    }

    addData(data, type) {
        this.data.push(data);
        this.types.push(type);
    }

    getSize() {
        let size = 12;

        for (let i = 0; i < this.data.length; i++) {
            switch (this.types[i]) {
                case DataTypes.UInt32BE:
                    size += 4;
                    break;
                case DataTypes.byte:
                    size++;
                    break;
                default:
                    size += this.data[i].length;
                    break;
            }
        }

        return size;
    }
}

export default ChunkPNG;
