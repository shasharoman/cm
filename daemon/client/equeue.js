const equeue = require('equeue');

const series = new equeue.Series();

process.on('server-ready', () => {
    series.start();
});

module.exports = series;