
var util = require('util');

var TallyServer = require('./server'),
    Metrics = require('./metrics'),
    object = require('./utils/object'),
    vals = require('./utils/vals');

// establish default options used for the server
var defaultOptions = {
    flushIntervalMs: 10000,
    prefix: 't.mgmt.'
};

var version = '0.1.0';

function ManagementServer(statsServer, options) {
    TallyServer.call(this, this.options);
    this.options = object.extend(defaultOptions, options || {});
    this._statsServer = statsServer;
}

util.inherits(ManagementServer, TallyServer);

ManagementServer.prototype._process = function (socketName, data) {
    var client = this._clients[socketName];
    switch (data.trim()) {
        case "help":
            client.write("\nCommands: info, counters, ratings, aggregates, quit");
            client.write('\n<END\n\n');
            break;
        case "info":
            var now = new Date().getTime();
            var uptime = Math.round((now - this._statsServer._startupTime) / 1000);
            client.write("\npid: " + process.pid);
            client.write("\nversion [node]: " + process.version);
            client.write("\nuptime: " + process.uptime());
            client.write("\nactive connections: " + this._statsServer._activeConnections);

            var memoryUsage = process.memoryUsage();
            client.write("\nmemory [rss]: " + memoryUsage.rss);
            client.write("\nmemory [heap total]: " + memoryUsage.heapTotal);
            client.write("\nmemory [heap used]: " + memoryUsage.heapUsed);
            client.write("\narch: " + process.arch);
            client.write("\nplatform: " + process.platform);
            client.write('\n<END\n\n');
            break;
        case "counters":
            client.write(util.inspect(this._statsServer.metrics.results().current));
            client.write('\n<END\n\n');
            break;
        case "ratings":
            client.write(util.inspect(this._statsServer.metrics.results().ratings));
            client.write('\n<END\n\n');
            break;
        case "aggregates":
            client.write(util.inspect(this._statsServer.metrics.results().aggregates));
            client.write('\n<END\n\n');
            break;
        case "quit":
            client.end();
            break;
        default:
            client.write("\nERROR\n");
            client.write('\n<END\n\n');
            break;
    }
};

// exports the new prototype of a mgmt server
module.exports = ManagementServer;
