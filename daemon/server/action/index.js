const rpc = require('../lib/rpc');

rpc.register('list', require('./list'));
rpc.register('start', require('./start'));
rpc.register('restart', require('./restart'));
rpc.register('reload', require('./reload'));
rpc.register('reset', require('./reset'));
rpc.register('stop', require('./stop'));
rpc.register('remove', require('./remove'));
rpc.register('rename', require('./rename'));
rpc.register('post', require('./post'));

rpc.register('kill', require('./kill'));