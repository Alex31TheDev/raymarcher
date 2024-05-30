const Benchmark = {
    data: {},
    timepoints: new Map(),

    startTiming: key => {
        const t1 = Date.now();
        Benchmark.timepoints.set(key, t1);
    },

    stopTiming: key => {
        const t1 = Benchmark.timepoints.get(key);

        if (typeof t1 === "undefined") {
            return;
        }

        Benchmark.timepoints.delete(key);

        const t2 = Date.now(),
            diff = t2 - t1;

        Benchmark.data[key] = diff;
    },

    getTime: key => {
        const time = Benchmark.data[key];

        if (typeof time === "undefined") {
            return "not found";
        }

        return time.toLocaleString() + "ms";
    },

    clear: _ => {
        for (const key of Object.keys(this.data)) {
            delete this.data[key];
        }

        this.timepoints.clear();
    },

    getAll: _ => {
        const times = Object.entries(Benchmark.data).map(x => {
            const [key, time] = x;
            return `${key}: ${time.toLocaleString()}ms`;
        });

        return times.join(",\n");
    }
};

export default Benchmark;
