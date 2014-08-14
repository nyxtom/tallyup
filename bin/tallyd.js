#!/usr/bin/env node

/**
 * Module dependencies
 */

var fs = require('fs'),
    path = require('path');

var args = require('minimist')(process.argv);
var tally = require('./../');

// output how to use tallyd
function usage() {
    console.log("Usage: tallyd --port=1234");
    return;
}

function log(message) {
    var time = new Date();
    console.log('[ ' + time + ' ] ' + message);
}

// help command
if (args.help || args.h) {
    return usage();
}

// Parse the arguments
var port = 8711;
if (args.port) {
    port = args.port;
}
var mgmtPort = port + 1;
if (args.mgmtPort) {
    mgmtPort = args.mgmtPort;
}

var server = tally.app;
server.listen(port, function () {
    log('Listening on port ' + port + '...');
});
server.on('clientConnect', function (clientName) {
    log(clientName + ' connected.');
});
server.on('clientDisconnect', function (clientName) {
    log(clientName + ' disconnected.');
});
server.on('error', function (clientName, error) {
    log(clientName + ' ERROR: ' + error)
});
server.on('flush', function (results) {
    log('flush:\n ' + JSON.stringify(results, null, 2));
});

var mgmt = tally.mgmt;
mgmt.listen(mgmtPort, function () {
    log('Management server listening on port ' + mgmtPort + '...');
});
mgmt.on('clientConnect', function (clientName) {
    log(clientName + ' connected.');
});
mgmt.on('clientDisconnect', function (clientName) {
    log(clientName + ' disconnected.');
});
mgmt.on('error', function (clientName, error) {
    log(clientName + ' ERROR: ' + error)
});
