const debug = require('debug')('daemon:server:lib:app');

const p = require('path');
const cluster = require('cluster');
const dateFns = require('date-fns');

const pub = require('./pub');
const C = require('../../const');
const util = require('../../util');

let id = 1;

cluster.setupMaster({
    exec: p.resolve(__dirname, './app-wrap.js')
});

module.exports = class App {
    constructor(name, script, args, env = {}) {
        this.id = id++;
        this.name = name;
        this.script = script;
        this.args = args;
        this.status = C.APP_STATUS.STOPED;
        this.env = env;

        this.worker = null;
        this.pid = null;
        this.createTs = Date.now();
        this.lastStartTs = null;
        this.restartCnt = 0;
    }

    clone() {
        return new App(this.name, this.script, this.args);
    }

    async start() {
        this._info(`starting(${this.script})`);

        if (!this.setStatus(C.APP_STATUS.STARTING)) {
            return;
        }

        return new Promise((resolve, reject) => {
            let worker = cluster.fork(Object.assign({}, this.env, {
                name: this.name,
                script: this.script,
                args: this.args.join(' ')
            }));
            worker.on('online', () => {
                if (!this.setStatus(C.APP_STATUS.RUNNING)) {
                    return;
                }

                this._info(`worker:${worker.process.pid} online`);

                this.pid = worker.process.pid;
                this.lastStartTs = Date.now();
                resolve();
            });
            worker.on('error', err => {
                this._error(`worker:${worker.process.pid} error`, err);

                reject(err);
            });

            worker.on('exit', (code, signal) => {
                this._info(`worker:${worker.process.pid} exited with code:${code} signal:${signal}`);

                // for reloading worker replace
                if (this.worker !== worker) {
                    return;
                }

                if (this.status === C.APP_STATUS.RUNNING) {
                    this.setStatus(C.APP_STATUS.STOPING);
                    process.nextTick(async () => {
                        await this.restart();
                    });
                }

                if (this.setStatus(C.APP_STATUS.STOPED)) {
                    this.lastStartTs = null;
                    this.worker = null;
                    this.pid = null;
                }
            });
            this.worker = worker;
        });
    }

    async restart() {
        this._info('restarting');

        this.restart.retry = this.restart.retry || 0;
        if (this.restart.retry >= 15) {
            this._error(`restart too much times:${this.restart.retry}`);
            return;
        }
        if (this.restart.retryResetTimer) {
            clearTimeout(this.restart.retryResetTimer);
        }
        this.restart.retryResetTimer = setTimeout(() => {
            this.restart.retry = 0;
        }, 5000);

        await this.stop();
        await this.start();

        this.restartCnt++;
        this.restart.retry++;
    }

    async reload(timeout = 2000) {
        this._info('reloading');

        if (!this.setStatus(C.APP_STATUS.RELOADING)) {
            return;
        }

        let worker = this.worker;
        await this.start();
        await this._exit(worker, timeout);
        while (!worker.isDead()) {
            await util.sleep(Math.floor(Math.random() + 1) * 100); // 100-200ms
        }
    }

    async stop(timeout = 1000) {
        this._info('stoping');

        if (!this.setStatus(C.APP_STATUS.STOPING)) {
            return;
        }

        await this._exit(this.worker, timeout);
        while (this.status !== C.APP_STATUS.STOPED) {
            await util.sleep(Math.floor(Math.random() + 1) * 100); // 100-200ms
        }
    }

    async post(signal, worker) {
        worker = worker || this.worker;
        if (!worker) {
            this._error('worker not ready');
            return;
        }

        this._info(`posting msg:${signal} to worker:${worker.process.pid}`);
        worker.send(signal);
    }

    setName(name) {
        this._info(`name:${this.name} => ${name}`);

        this.name = name;
        // TODO: change process title
    }

    setRestart(cnt) {
        this._info(`restart:${this.restartCnt} => ${cnt}`);

        this.restartCnt = cnt;
    }

    setStatus(status) {
        let next = {
            [C.APP_STATUS.STARTING]: [C.APP_STATUS.RUNNING],
            [C.APP_STATUS.RUNNING]: [C.APP_STATUS.RELOADING, C.APP_STATUS.STOPING],
            [C.APP_STATUS.STOPING]: [C.APP_STATUS.STOPED],
            [C.APP_STATUS.STOPED]: [C.APP_STATUS.STARTING],
            [C.APP_STATUS.RELOADING]: [C.APP_STATUS.STARTING]
        };

        let allow = next[this.status] && next[this.status].includes(status);
        if (allow) {
            this._info(`status:${this.status} => ${status}`);

            this.status = status;
        }

        if (!allow) {
            this._error(`status:${this.status} => ${status} deny`);
        }
        return allow;
    }

    async _exit(worker, timeout = 10000) {
        this._info(`worker:${worker.process.pid} exiting`);

        if (worker.isDead()) {
            return;
        }

        return new Promise(resolve => {
            this.post('exit', worker);
            let timer = setTimeout(() => this._kill(worker, timeout), timeout);

            worker.on('disconnect', () => {
                this._info(`worker:${worker.process.pid} disconnected`);

                timer && clearTimeout(timer);
                resolve();
            });

            this._info(`worker:${worker.process.pid} disconnecting`);
            worker.disconnect();
        });
    }

    async _kill(worker, timeout = 1000) {
        this._info(`killing worker:${worker.process.pid}`);

        if (worker.isDead()) {
            return;
        }

        this.post('kill', worker);
        let timer = setTimeout(() => {
            if (worker.isDead()) {
                return;
            }

            this._info(`send SIGKILL to worker:${worker.process.pid}`);
            worker.kill('SIGKILL');
        }, timeout);

        return new Promise(resolve => {
            worker.on('disconnect', () => {
                this._info(`worker:${worker.process.pid} disconnected`);

                timer && clearTimeout(timer);
                resolve();
            });

            this._info(`send SIGTERM to worker:${worker.process.pid}`);
            worker.kill('SIGTERM');
        });
    }

    async _info(...args) {
        args = args.map(item => item.toString()).join(', ');

        let msg = `${this.name}:${this.id} ${args}`;
        debug(msg);
        pub.res(`${dateFns.format(Date.now(), 'HH:mm:ss')} ${msg}`);
    }

    async _error(...args) {
        args = args.map(item => item.toString()).join(', ');

        let msg = `${this.name}:${this.id} ${args}`;
        debug(msg);
        pub.err(`${dateFns.format(Date.now(), 'HH:mm:ss')} ${msg}`);
    }
};