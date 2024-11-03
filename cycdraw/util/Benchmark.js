const Benchmark = {
    data: Object.create(null),
    timepoints: new Map(),

    getCurrentTime: _ => {
        return performance.now();
    },

    startTiming: key => {
        key = Benchmark._formatKey(key);

        const t1 = Benchmark.getCurrentTime();
        Benchmark.timepoints.set(key, t1);
    },

    stopTiming: key => {
        key = Benchmark._formatKey(key);
        const t1 = Benchmark.timepoints.get(key);

        if (typeof t1 === "undefined") {
            return;
        }

        Benchmark.timepoints.delete(key);

        const t2 = Benchmark.getCurrentTime(),
            dt = Math.floor(t2 - t1);

        Benchmark.data[key] = dt;
    },

    getTime: key => {
        key = Benchmark._formatKey(key);
        const time = Benchmark.data[key];

        if (typeof time === "undefined") {
            return "Key not found";
        }

        return `${key}: ${time.toLocaleString()}ms`;
    },

    deleteTime: key => {
        key = Benchmark._formatKey(key);
        Benchmark.timepoints.delete(key);

        if (key in Benchmark.data) {
            delete Benchmark.data[key];
            return true;
        }

        return false;
    },

    clear: _ => {
        Benchmark.timepoints.clear();

        for (const key of Object.keys(Benchmark.data)) {
            delete Benchmark.data[key];
        }
    },

    getAll() {
        const times = Object.keys(Benchmark.data).map(key => Benchmark.getTime(key));
        return times.join(",\n");
    },

    _formatKey: key => {
        switch (typeof key) {
            case "number":
                return key.toString();
            case "string":
                return key;
            default:
                throw new Error("Time keys must be strings");
        }
    }
};

export default Benchmark;
