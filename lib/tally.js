
/**
 * Module dependences
 */

var server = require('./server');

/**
 * Routine extension dependencies.
 */

var object = require('./utils/object');

/**
 * Module version
 */

exports.version = "0.1.0";

/**
 * Returns the application context
 *
 * @return {App}
 * @api public
 */
exports.createServer = function (options) {
    return server.createServer(options);
};
