const debug = require('debug')('daemon:server:lib:bus');

const map = new Map();

exports.on = on;
exports.emit = emit;

function on(topic, callback) {
    debug('on topic:%s', topic);

    let callbacks = map.get(topic) || [];

    callbacks.push(callback);
    map.set(topic, callbacks);
}

async function emit(topic, ...args) {
    debug('emit topic:%s', topic);

    let callbacks = map.get(topic) || [];

    for (let item of callbacks) {
        try {
            await item(...args);
        }
        catch (err) {
            debug('send %s error', topic);
        }
    }
}