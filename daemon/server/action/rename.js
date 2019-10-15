const debug = require('debug')('deamon:server:action:rename');

const appStore = require('../store/app');
const pub = require('../lib/pub');

module.exports = async(from, to) => {
    debug('rename %s => %s', from, to);

    let err = await appStore.eachByMatch(from, async item => {
        item.setName(to);
    });
    err && pub.err(err);
};