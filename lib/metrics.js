
function Metrics() {
	this._counters = {};
	this._ratings = {};
	this._lastTime = 0;
	this._timestamp = 0;
}

Metrics.prototype.incr = function (k, v) {
	if (!this._counters.hasOwnProperty(k)) {
		this._counters[k] = 0;
	}
	this._counters[k] += v;
};

// represents a singular rating counter
// combined with a value associated with the rating
Metrics.prototype.rate = function (k, v) {
	this.incr(k + "_count", 1);
	if (!this._ratings.hasOwnProperty(k)) {
		this._ratings[k] = 0;
	}
	this._ratings[k] += v;
};

Metrics.prototype.process = function () {
	var start = Date.now();
	this.time();

	var results = {};
	var counterRates = {};
	var ratingResults = {};
	var counters = this._counters;
	var ratings = this._ratings;

	// Calculate the amount of time in between
	// in order to create a counter rate per second/per minute..etc
	var diff = start - this._lasttime;

	for (var k in counters) {
		var v = counters[v];

		// count / interval rate (avg over the difference of the time)
		counterRates[k] = value / (diff / 1000);
	}

	// Calculate average ratings over time
	for (var k in ratings) {
		var v = ratings[k];

		// Ensure that the counter is available
		var countKey = k + "_count";
		if (!counters.hasOwnProperty(countKey)) {
			continue;
		}

		// calculate ratings such as avg..etc
		var count = counters[countKey];
		if (count < 1) {
			continue;
		}

		ratingResults[k] = { 'avg': (v / count), 'sum': v, 'count': count };
	}

	results['processing_time'] = (Date.now() - start);
	results['counter_rates'] = counterRates;
	results['ratings'] = ratingResults;
	results['counters'] = counters;
	return results;
};

Metrics.prototype.time = function () {
	this._lastTime = this._timestamp;
	this._timestamp = Date.now();
};

module.exports = Metrics;
