const debug = require('debug')('deamon:server:action:restart');

const appStore = require('../store/app');
const pub = require('../lib/pub');

module.exports = async(app) => {
    debug('app %s', app);

    let err = await appStore.eachByMatch(app, async item => {
        await item.restart();
    });
    err && pub.err(err);
};