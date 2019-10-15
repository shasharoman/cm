const debug = require('debug')('deamon:server:action:reload');

const appStore = require('../store/app');
const pub = require('../lib/pub');

module.exports = async(app) => {
    debug('app %s', app);

    let err = await appStore.eachByMatch(app, async item => {
        await item.reload();
    });
    err && pub.err(err);
};