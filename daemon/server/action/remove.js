const debug = require('debug')('deamon:server:action:remove');

const appStore = require('../store/app');
const pub = require('../lib/pub');

module.exports = async(app) => {
    debug('app %s', app);

    let err = await appStore.eachByMatch(app, async item => {
        await item.stop();
        appStore.removeById(item.id);
    });
    err && pub.err(err);
};