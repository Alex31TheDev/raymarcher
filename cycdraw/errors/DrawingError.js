class DrawingError extends Error {
    constructor(message = "", ...args) {
        super(message, ...args);

        this.name = "DrawingError";
        this.message = message;
    }
}

export default DrawingError;
