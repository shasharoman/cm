const debug = require('debug')('deamon:server:action:stop');

const appStore = require('../store/app');
const pub = require('../lib/pub');

module.exports = async(app) => {
    debug('app %s', app);

    let err = await appStore.eachByMatch(app, async item => {
        await item.stop();
    });
    err && pub.err(err);
};