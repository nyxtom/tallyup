
var stream = require('stream'),
    util = require('util');

function ConsoleListener() {
    stream.Writable.call(this);
}

util.inherits(ConsoleListener, stream.Writable);

ConsoleListener.prototype._write = function (data) {
    var time = new Date();
    var j = JSON.parse(data.toString());
    console.log(util.inspect(j, false, 5, true));
};

module.exports = ConsoleListener;
