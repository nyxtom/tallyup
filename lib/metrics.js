
function Metrics() {
    this._counters = {};
    this._aggregates = {};
    this._ratings = {};
    this._lastTime = 0;
    this._timestamp = 0;
    this._counterRates = {};
    this.prefix = 't.';
}

Metrics.prototype.incr = function (k, v) {
    if (!this._counters.hasOwnProperty(k)) {
        this._counters[k] = 0;
    }
    this._counters[k] += v;
};

Metrics.prototype.aggr = function (k, v) {
    if (!this._aggregates.hasOwnProperty(k)) {
        this._aggregates[k] = 0;
    }
    this._aggregates[k] += v;
};

// represents a singular rating counter
// combined with a value associated with the rating
Metrics.prototype.rate = function (k, v) {
    this.incr(k, 1);
    this.incr(this.prefix + 'ratings', 1);
    if (!this._ratings.hasOwnProperty(k)) {
        this._ratings[k] = 0;
    }
    this._ratings[k] += v;
};

Metrics.prototype.clear = function () {
    for (var k in this._counters) {
        this._counters[k] = 0;
    }
};

Metrics.prototype.process = function () {
    var start = Date.now();
    this.time();

    var results = {};
    var counterRates = {};
    var ratingResults = {};
    var counters = this._counters;
    var ratings = this._ratings;
    var aggregates = this._aggregates;

    // Calculate the amount of time in between
    // in order to create a counter rate per second/per minute..etc
    var diff = this._timestamp - this._lastTime;
    var temp = this._lastTime;
    this._lastTime = this._timestamp;
    if (temp == 0) {
        return;
    }

    for (var k in counters) {
        var v = counters[k];

        // store the aggregate stats appropriately
        this.aggr(k, v);

        // count / interval rate (avg over the difference of the time)
        counterRates[k] = v / (diff / 1000);
    }

    // Calculate average ratings over time
    for (var k in ratings) {
        var v = ratings[k];

        // Ensure that the counter is available
        if (!aggregates.hasOwnProperty(k)) {
            continue;
        }

        // calculate ratings such as avg..etc
        var count = aggregates[k];
        if (count < 1) {
            continue;
        }

        ratingResults[k] = { 'avg': (v / count), 'sum': v, 'count': count };
    }

    // Iterate over current counter rates to store the last X time periods
    for (var k in counterRates) {
        if (!this._counterRates.hasOwnProperty(k)) {
            this._counterRates[k] = [];
        }

        if (this._counterRates[k].length > this._rateHistory) {
            this._counterRates[k].pop();
        }

        this._counterRates[k].push(counterRates[k]);
    }

    for (var k in counterRates) {
        var history = this._counterRates[k];

        var sum = 0;
        var peak = 0;
        for (var i = 0; i < history.length; i++) {
            sum += history[i];
            if (history[i] > peak) {
                peak = history[i];
            }
        }

        var avg = sum / history.length;

        // store counter rates when applied to ratings
        if (ratingResults.hasOwnProperty(k)) {
            ratingResults[k].avg_rps = avg;
        }
    }

    results['tallyd'] = {};
    results['tallyd']['processing_time'] = (Date.now() - start);
    results['tallyd']['timestamp'] = new Date(this._timestamp);
    results['tallyd']['timestamp_prev'] = new Date(this._timestamp - diff);
    results['current'] = {};
    results['current']['counters'] = counters;
    results['current']['counters_per_second'] = counterRates;
    results['ratings'] = ratingResults;
    results['aggregates'] = aggregates;
    return results;
};

Metrics.prototype.time = function () {
    this._timestamp = Math.round(new Date().getTime());
};

module.exports = Metrics;
