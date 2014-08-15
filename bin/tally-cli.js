#!/usr/bin/env node

/**
* Module dependencies
*/

var fs = require('fs'),
    path = require('path'),
    net = require('net'),
    readline = require('readline');

var args = require('minimist')(process.argv);
var tally = require('./../');

function usage() {
    console.log('tally-cli --host 127.0.0.1 --port 8712');
    return;
}

// help command
if (args.help || args.h) {
    return usage();
}

var port = 8712;
if (args.port) {
    port = args.port;
}

var host = '127.0.0.1';
if (args.host) {
    host = args.host;
}

// create a readline interface
var rl = readline.createInterface(process.stdin, process.stdout);
rl.setPrompt('> ');

// create a simple tcp client to connect to the management server
var client = net.Socket();
client.connect(port, host, function () {
    console.log('Connected to tallyd management server ' + host + ':' + port);
    console.log('// type help to see a list of commands');
    rl.prompt();
    rl.on('line', function (line) {
        client.write(line.toString());
        if (!args.mgmt) {
            rl.prompt();
        }
    });
});
client.on('data', function (data) {
    var str = data.toString().trim();
    if (str.indexOf("\n<END") == (str.length - 5)) {
        if (str.length > 4) {
            console.log(str.slice(0, str.length - 5));
        }
        rl.prompt(true);
    } else {
        console.log(str);
    }
});
client.on('close', function () {
    rl.close();
});
