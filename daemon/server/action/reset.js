const debug = require('debug')('deamon:server:action:reset');

const appStore = require('../store/app');
const pub = require('../lib/pub');

module.exports = async(app) => {
    debug('app %s', app);

    let err = await appStore.eachByMatch(app, async item => {
        item.setRestart(0);
    });
    err && pub.err(err);
};