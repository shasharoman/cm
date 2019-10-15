const debug = require('debug')('deamon:server:action:post');

const appStore = require('../store/app');
const pub = require('../lib/pub');

module.exports = async(app, msg) => {
    debug('app %s', app);

    let err = await appStore.eachByMatch(app, async item => {
        await item.post(msg);
    });
    err && pub.err(err);
};