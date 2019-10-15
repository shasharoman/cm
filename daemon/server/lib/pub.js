const debug = require('debug')('daemon:server:lib:pub');

const fs = require('fs');
const sok = require('sok');

const C = require('../../const');
const bus = require('./bus');

let path = C.PUB_PATH;
let pub = null;

exports.publish = publish;
exports.res = res;
exports.err = err;

(async() => {
    debug('pubsub listen on %s', path);

    fs.existsSync(path) && fs.unlinkSync(path);

    pub = new sok.pubsub.Pub(path);

    await bus.emit(C.BUS_TOPIC.READY, C.BUS_READY_EVENT.PUB);

    setInterval(() => publish('pid', process.pid), 1000);
})();

function publish(topic, msg) {
    pub.publish(JSON.stringify({
        topic,
        msg
    }));
}

function res(msg) {
    publish(C.PUBLISH_TOPIC.RES, msg);
}

function err(msg) {
    publish(C.PUBLISH_TOPIC.ERR, msg);
}