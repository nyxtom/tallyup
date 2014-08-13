
/**
 * Module dependences
 */

var events = require('events'),
    check = require('validator').check;

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
    return app.createServer(options);
};
