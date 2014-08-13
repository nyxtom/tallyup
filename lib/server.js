
/**
* Module dependencies
*/

var events = require('events'),
	util = require('util'),
	net = require('net');

var Metrics = require('./metrics'),
	object = require('./utils/object'),
	vals = require('./utils/vals');

// establish default options used for the server
var defaultOptions = {
	flushIntervalMs: 10000,
	prefix: 'tally.'
};

function TallyServer(options) {
	events.EventEmitter.call(this);

	this._clients = {};
	this._types = {};
	this.options = object.extend(defaultOptions || {});

	var prefix = this.options.prefix;
	this._counterkey_packets = prefix + 'packets';
	this._counterkey_malformed = prefix + 'malformed_packets';
	this.metrics = new Metrics();
	this.listeners = [];

	this._initDefaultHandlers();
};

util.inherits(TallyServer, events.EventEmitter);

// Performs a flush routine for regular counter retreival/storage/publishing
TallyServer.prototype.flushMetrics = function () {
	var self = this;
	this.metrics.time();
	var results = this.metrics.process();
	for (var l = 0; l < self.listeners.length; l++) {
		var listener = self.listeners[l];
		listener.write(results);
	}
};

// Pushes the given write stream on the list of listeners
// that subscribe to the flush routine when metrics
// are tallied and processed to completion.
TallyServer.prototype.pipe = function (writeStream) {
	this.listeners.push(writeStream);
};

// listens on the specified port by generating a network server
// while listening to incomming client connections. client connections
// are stored in a local memory list while data is transported and
// processed appropriately from each of the clients
TallyServer.prototype.listen = function (port, callback) {
	var self = this;
	this._server = net.createServer(function (socket) {
		// Describe and push the client to the managed clients list
		socket.name = socket.remoteAddress + ":" + socket.remotePort;
		self._clients[socket.name] = socket;

		// Notify that the given client is now connected to the server
		self.emit('clientConnect', socket.name);

		// Subscribe to events processed by this particular socket
		socket.on('data', function (data) {
			self.emit('data', socket.name, data);

			self.metrics.incr(self._counterkey_packets, 1);
			self._process(socket.name, data);
		});

		// Publish error messages received from a client with the source itself
		socket.on('error', function (error) {
			self.emit('error', socket.name, error);
		});

		// Remove the client when we are no longer using it
		socket.on('end', function () {
			self.emit('clientDisconnect', socket.name);
			delete self._clients[socket.name];
		});
	});
	this._initFlushInterval();
	this._server.listen(port, callback);
};

// Subscribes a type command issued when data is received from a client
// The callback will be provided the appropriate key, value, and socket name
// associated with the packet. key and value have not been processed/manipulated
TallyServer.prototype.handle = function (type, callback) {
	if (typeof callback != 'function') {
		throw Error("Must provide a valid callback for subscribing to typed commands");
	}

	this.types[type] = callback;
};

// closes the active server from receiving any more data, flushes existing metrics
// and finally clears any latent interval or routines before exiting
TallyServer.prototype.close = function () {
	this._server.close();
	this.flushMetrics();
	clearInterval(this._flushInterval);
};

// initializes default type command handlers that will bind to metric operations
TallyServer.prototype._initDefaultHandlers = function () {
	// handle a simple increment function
	this.handle('incr', function (metrics, socketName, k, v) {
		var num = vals.atoi(v);
		if (isNaN(num)) {
			return false;
		}

		metrics.incr(k, num);
		return true;
	});

	// handle when a rate command is initiated
	this.handle('rate', function (metrics, socketName, k, v) {
		var num = vals.atoi(v);
		if (isNaN(num)) {
			return false;
		}

		metrics.rate(k, num);
		return true;
	});
};

// Spawns the appropriate routine for flush management
TallyServer.prototype._initFlushInterval = function () {
	var self = this;
	this.metrics.time();
	this._flushInterval = setInterval(function () {
		self.flushMetrics();
	}, this.flushInterval)
};

TallyServer.prototype._process = function (socketName, data) {
	var metrics = [ data ];
	if (data.indexOf("\n") > -1) {
		metrics = data.split("\n");
	}

	// Iterate over the metrics found and perform analysis
	for (var m in metrics) {
		// skip empty data
		if (metrics[m].length == 0) {
			continue;
		}

		// ensure that malformed packets are not processed (exit early)
		var metric = metrics[m];
		if (metric.indexOf(':') < 0 || metric.indexOf('|') < 0) {
			this.metrics.incr(this._counterkey_malformed, 1);
			continue;
		}

		// key:value|cmd
		var bits = metric.toString().trim().split(':');
		var key = bits.shift()
					.replace(/\s+/g, '_')
					.replace(/\//g, '-')
					.replace(/[^a-zA-Z_\-0-9\.]/g, '');

		for (var i = 0; i < bits.length; i++) {
			var fields = bits[i].split('|');
			var value = fields[0];
			var type = fields[1];
			if (!value || !type) {
				this.metrics.incr(this._counterkey_malformed, 1);
				continue;
			}

			// Pass the key, value, and type to be handled appropriately
			var result = this._processType(socketName, key, value, type);
			if (!result) {
				this.metrics.incr(this._counterkey_malformed, 1);
				continue;
			}
		}
	}
};

// Given the key, value, and type, processType will ensure that the
// appropriate stats are incremented or calculated based on existing implementations
// Process type is intended to be abstract to allow for newer command types to
// handle more complex tasks that might deviate from incr/decr tasks (for instance, we
// may wish to use this in a game for executing a test collision)
TallyServer.prototype._processType = function (socketName, key, value, type) {
	if (!this.types.hasOwnProperty(type)) {
		this.metrics.incr(this._counterkey_malformed, 1);
		this._clients[socketName].write('ERROR: ' + type + ' is not valid\n');
	}

	return this._types[type](this.metrics, socketName, key, value);
};

// setup a simple endpoint for creating a new server with the given options
exports.createServer = function (options) {
    return new TallyServer(options);
};