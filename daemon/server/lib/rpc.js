const debug = require('debug')('daemon:server:lib:rpc');

const _ = require('lodash');
const fs = require('fs');
const sok = require('sok');

const C = require('../../const');
const bus = require('./bus');

const map = new Map();
const path = C.RPC_PATH;

(async() => {
    debug('rpc listen on %s', path);

    fs.existsSync(path) && fs.unlinkSync(path);

    await new sok.reqres.Res(async(name, ...args) => {
        let fn = map.get(name);
        if (!fn) {
            return {
                code: 1,
                msg: `rpc ${name} not found`
            };
        }

        try {
            let ret = await fn(...args);
            return {
                code: 0,
                msg: 'ok',
                result: ret
            };
        }
        catch (err) {
            debug('rpc call error', err);
            return {
                code: 1,
                msg: err.toString().replace(/^Error: /, '')
            };
        }
    }).listen(path);

    await bus.emit(C.BUS_TOPIC.READY, C.BUS_READY_EVENT.RPC);
})();

exports.register = register;

function register(name, call) {
    if (!_.isFunction(call)) {
        throw new Error('expect call is function');
    }

    map.set(name, call);
}