const debug = require('debug')('daemon:client:rpc');

const fs = require('fs');
const sok = require('sok');

const C = require('../const');
const util = require('../util');

const path = C.RPC_PATH;

let req = null;
let closeTimer = null;

exports.call = call;

async function call(name, ...args) {
    try {
        if (closeTimer) {
            clearTimeout(closeTimer);
        }

        return await new Promise(async(resolve, reject) => {
            try {
                req = req || await connect();
                req.send(name, ...args, (err, res) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (res.code !== 0) {
                        reject(new Error(res.msg));
                        return;
                    }

                    resolve(res.result);
                });
            }
            catch (err) {
                reject(err);
            }
        });
    }
    finally {
        closeTimer = setTimeout(() => {
            req && req.close();
            req = null;
        }, 300);
    }
}

async function connect(retry = 5) {
    debug('try connect to rpc-server on %s', path);

    if (retry <= 0) {
        throw new Error('connect retry too times');
    }

    if (!fs.existsSync(path)) {
        await util.sleep(100);
        return await connect(retry - 1);
    }

    try {
        return await new Promise((resolve, reject) => {
            try {
                let req = new sok.reqres.Req(path, 120000);
                req.on('error', err => {
                    reject(err);
                });

                req.on('connect', () => {
                    resolve(req);
                });
            }
            catch (err) {
                reject(err);
            }
        });
    }
    catch (err) {
        await util.sleep(100);
        return await connect(retry - 1);
    }
}