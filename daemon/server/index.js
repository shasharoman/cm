const debug = require('debug')('daemon:server');

const os = require('os');
const sok = require('sok');
const cp = require('child_process');
const _ = require('lodash');
const fs = require('fs');

const C = require('../const');
const bus = require('./lib/bus');

// is fork
if (typeof process.send === 'function') {
    debug('start server');

    process.title = 'CM daemon';
    process.chdir(os.homedir());

    let waiting = [
        C.BUS_READY_EVENT.PUB,
        C.BUS_READY_EVENT.RPC
    ];
    bus.on('ready', who => {
        debug('receive %s ready msg', who);

        _.pull(waiting, who);
        if (_.isEmpty(waiting)) {
            process.send('ready');
        }
    });
    require('./lib/pub');
    require('./lib/rpc');

    require('./action');
}

// not fork
if (typeof process.send === 'undefined') {
    let sub = new sok.pubsub.Sub(C.PUB_PATH);
    sub.on('error', () => {
        debug('fork server process');

        let logStream = fs.createWriteStream(C.DAEMON_LOG, {
            flags: 'a'
        });

        logStream.on('open', () => {
            let child = cp.fork(__filename, [], {
                cwd: process.cwd(),
                env: Object.assign(process.env, {}),
                detached: true,
                stdio: ['ignore', logStream, logStream, 'ipc']
            });

            child.unref();

            child.once('message', () => {
                debug('server ready');
                process.emit('server-ready');

                child.disconnect();
                sub.close();
            });
        });
    });

    sub.on('connect', () => {
        debug('server ready');
        process.emit('server-ready');

        sub.close();
    });
}