import Point from "./Point.js";

class Grid {
    constructor(x1, y1, x2, y2, xDiv, yDiv) {
        this.xDiv = xDiv;
        this.yDiv = yDiv;

        this.w = Math.abs(x2 - x1);
        this.h = Math.abs(y2 - y1);

        this.xMult = this.w / xDiv;
        this.yMult = this.h / yDiv;

        if (x1 > x2) {
            this.x = x2;
        } else {
            this.x = x1;
        }

        if (y1 > y2) {
            this.y = y2;
        } else {
            this.y = y1;
        }
    }

    point(i, j) {
        return new Point(this.x + i * this.xMult, this.y + j * this.yMult);
    }
}

export default Grid;
