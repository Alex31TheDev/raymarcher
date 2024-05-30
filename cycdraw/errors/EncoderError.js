class EncoderError extends Error {
    constructor(message = "", ...args) {
        super(message, ...args);

        this.name = "EncoderError";
        this.message = message;
    }
}

export default EncoderError;
