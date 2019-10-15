const _ = require('lodash');

const C = require('../../const');

const items = [];

exports.items = list;
exports.add = add;
exports.byId = byId;
exports.byName = byName;
exports.removeById = removeById;
exports.removeByName = removeByName;

exports.eachByMatch = eachByMatch;

function list() {
    return _.orderBy(items, ['name', 'id'], ['asc', 'asc']);
}

function add(item) {
    items.push(item);
}

function byId(id) {
    return _.find(items, {
        id
    }) || {};
}

function byName(name) {
    return _.filter(items, {
        name
    }) || [];
}

function removeById(id) {
    _.remove(items, {
        id
    });
}

function removeByName(name) {
    _.remove(items, {
        name
    });
}

async function eachByMatch(match, fn) {
    let found = list();
    if (match === C.APP_ALL && _.isEmpty(found)) {
        return;
    }

    if (match && match !== C.APP_ALL) {
        found = byName(match);
    }
    if (_.isEmpty(found) && !_.isNaN(Number(match))) {
        found = _.filter([byId(Number(match))], item => !_.isEmpty(item));
    }

    if (_.isEmpty(found)) {
        return `app:${match} not found`;
    }

    try {
        for (let item of found) {
            await fn(item);
        }
    }
    catch (err) {
        return err.toString();
    }
}