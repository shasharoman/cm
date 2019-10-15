const debug = require('debug')('deamon:server:action:kill');

const C = require('../../const');
const appStore = require('../store/app');
const pub = require('../lib/pub');

module.exports = async() => {
    debug('kill daemon');

    let err = await appStore.eachByMatch(C.APP_ALL, async item => {
        await item.stop();
    });
    err && pub.err(err);

    pub.res('daemon killed');
    setTimeout(() => {
        process.exit(0);
    }, 100);
};