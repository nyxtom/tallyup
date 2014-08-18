
/**
 * Module dependences
 */

var server = require('./server'),
    mgmtServer = require('./mgmt');

/**
 * Routine extension dependencies.
 */

var object = require('./utils/object');

/**
 * Module version
 */

exports.version = "0.1.2";

/**
 * Returns the application context
 *
 * @return {app,mgmt}
 * @api public
 */
exports.app = new server();
exports.mgmt = new mgmtServer(exports.app);

exports.loadListener = function (name) {
    var listener = require(name);
    return new listener();
}

exports.shutdown = function () {
    exports.mgmt.close();
    exports.app.close();
};

process.on('SIGTERM', function () {
    exports.shutdown();
});
process.on('SIGINT', function () {
    exports.shutdown();
});
process.on('exit', function () {
    exports.shutdown();
});
