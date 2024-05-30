class ChecksumError extends Error {
    constructor(message = "", ...args) {
        super(message, ...args);

        this.name = "ChecksumError";
        this.message = message;
    }
}

export default ChecksumError;
