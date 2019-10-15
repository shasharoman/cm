const debug = require('debug')('deamon:server:action:list');

const T = require('cli-table');
const _ = require('lodash');
const dateFns = require('date-fns');

const pub = require('../lib/pub');
const appStore = require('../store/app');

module.exports = async() => {
    debug('list app');

    let items = appStore.items();

    let table = new T({
        head: ['id', 'name', 'script', 'status', 'pid', 'restart', 'up-time', 'create']
    });

    let rows = _.map(items, item => [
        item.id,
        item.name,
        item.script,
        item.status,
        item.pid || '-',
        item.restartCnt,
        item.lastStartTs ? dateFns.formatDistanceStrict(item.lastStartTs, Date.now()) : '-',
        dateFns.format(item.createTs, 'MM-dd HH:mm')
    ]);

    let grouped = _.groupBy(rows, item => item[1]);

    let isSingleApp = _.keys(grouped).length === 1;
    if (isSingleApp) {
        _.each(rows, item => table.push(item));
        pub.res(table.toString());
        return;
    }

    _.each(grouped, group => {
        table.push(_.map(_.zip(...group), item => item.join('\n')));
    });
    pub.res(table.toString());
};