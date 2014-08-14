
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
            client.write("Commands: stats, counters, ratings, aggregates, quit\n\n");
            break;
        case "stats":
            var now = new Date().getTime();
            var uptime = Math.round((now - this._statsServer._startupTime) / 1000);
            client.write("pid: " + process.pid);
            client.write("\nversion [node]: " + process.version);
            client.write("\nuptime: " + process.uptime());
            client.write("\nactive connections: " + this._statsServer._clients.length);

            var memoryUsage = process.memoryUsage();
            client.write("\nmemory [rss]: " + memoryUsage.rss);
            client.write("\nmemory [heap total]: " + memoryUsage.heapTotal);
            client.write("\nmemory [heap used]: " + memoryUsage.heapUsed);
            client.write("\narch: " + process.arch);
            client.write("\nplatform: " + process.platform);
            client.write("\nEND\n\n");
            break;
        case "counters":
            break;
        case "ratings":
            break;
        case "aggregates":
            break;
        case "quit":
            client.end();
            break;
        default:
            client.write("ERROR\n");
            break;
    }
};

// exports the new prototype of a mgmt server
module.exports = ManagementServer;
