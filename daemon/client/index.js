const debug = require('debug')('daemon:client');
const sok = require('sok');

const C = require('../const');
const rpc = require('./rpc');
const equeue = require('./equeue');
const util = require('../util');

exports.connect = connect;

exports.kill = kill;
exports.list = list;
exports.start = start;
exports.reload = reload;
exports.restart = restart;
exports.reset = reset;
exports.stop = stop;
exports.remove = remove;
exports.rename = rename;
exports.post = post;

exports.logPath = C.APP_LOG;
exports.daemonLogPath = C.DAEMON_LOG;

exports.disconnect = disconnect;

async function kill() {
    debug('kill');

    await equeue.exec(() => rpc.call('kill'));
}

async function list() {
    debug('list');

    await equeue.exec(() => rpc.call('list'));
}

async function start(options) {
    debug('start');

    await equeue.exec(() => rpc.call('start', options));
}

async function reload(app) {
    debug('reload');

    await equeue.exec(() => rpc.call('reload', app || C.APP_ALL));
}

async function restart(app) {
    debug('restart');

    await equeue.exec(() => rpc.call('restart', app || C.APP_ALL));
}

async function reset(name) {
    debug('reset');

    await equeue.exec(() => rpc.call('reset', name || C.APP_ALL));
}

async function stop(app) {
    debug('stop');

    await equeue.exec(() => rpc.call('stop', app || C.APP_ALL));
}

async function remove(app) {
    debug('remove');

    await equeue.exec(() => rpc.call('remove', app || C.APP_ALL));
}

async function rename(from, to) {
    debug('rename');

    await equeue.exec(() => rpc.call('rename', from, to));
}

async function post(app, msg) {
    debug('post');

    await equeue.exec(() => rpc.call('post', app || C.APP_ALL, msg));
}

function connect(fn) {
    debug('connect');

    connect.ing = true;
    equeue.exec(() => {
        let sub = connect.sub || new sok.pubsub.Sub(C.PUB_PATH);
        sub.subscribe(payload => {
            let {
                topic,
                msg
            } = JSON.parse(payload);

            let pass = [
                C.PUBLISH_TOPIC.RES,
                C.PUBLISH_TOPIC.ERR
            ];
            if (!pass.includes(topic)) {
                return;
            }

            fn(msg);
        });
        sub.on('connect', () => {
            connect.ing = false;
        });
        connect.sub = sub;
    });
}

async function disconnect() {
    debug('disconnect');

    while (connect.ing) {
        await util.sleep(100);
    }

    connect.sub && connect.sub.close();
    connect.sub = null;
}