const p = require('path');
const fs = require('fs');

const dir = p.resolve(process.env.HOME, '.cm');

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    fs.mkdirSync(p.resolve(dir, 'app'));
}

exports.PUB_PATH = p.resolve(dir, 'pub.sock');
exports.RPC_PATH = p.resolve(dir, 'rpc.sock');
exports.DAEMON_LOG = p.resolve(dir, 'daemon.log');
exports.APP_LOG = p.resolve(dir, 'app.log');

exports.BUS_TOPIC = {
    READY: 'ready'
};
exports.BUS_READY_EVENT = {
    PUB: 'pub',
    RPC: 'rpc'
};

exports.APP_STATUS = {
    STARTING: 'starting',
    RELOADING: 'reloading',
    RUNNING: 'running',
    STOPING: 'stoping',
    STOPED: 'stoped'
};

exports.APP_ALL = 0;

exports.PUBLISH_TOPIC = {
    PID: 'pid',
    RES: 'res',
    ERR: 'err'
};