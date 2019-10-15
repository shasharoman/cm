const debug = require('debug')('deamon:server:action:start');

const os = require('os');
const fs = require('fs');

const App = require('../lib/App');
const appStore = require('../store/app');
const pub = require('../lib/pub');

module.exports = async(options) => {
    debug('options %s', JSON.stringify(options));

    let {
        name,
        script,
        num,
        args
    } = options;

    if (!name || !script) {
        pub.err('start app must has name & script');
        return;
    }
    if (!fs.existsSync(script)) {
        pub.err(`script:${script} not exists`);
        return;
    }

    num = num || os.cpus().length;
    for (let i = 0; i < num; i++) {
        let app = new App(name, script, args);
        await app.start();
        appStore.add(app);
    }
};