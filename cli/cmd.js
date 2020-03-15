const daemon = require('../daemon');
const commander = require('commander');
const p = require('path');
const _ = require('lodash');
const cp = require('child_process');
const fs = require('fs');
const qs = require('querystring');

daemon.connect(msg => {
    console.log(msg);
});

commander.version('0.0.1')
    .description('minimal cluster manager for node.js')
    .usage('cmd [options]');

commander.command('start <script>')
    .description('start app with script path')
    .option('--name <name>')
    .option('--num <num>')
    .option('--env <env>')
    .action(async (script, options) => {
        await invoke(async () => {
            let args = [];
            if (commander.rawArgs.includes('--')) {
                args = commander.rawArgs.slice(commander.rawArgs.indexOf('--') + 1);
            }

            let env = {
                cwd: process.cwd()
            };
            if (options.env) {
                if (fs.existsSync(p.resolve(process.cwd(), options.env))) {
                    env = JSON.parse(fs.readFileSync(p.resolve(process.cwd(), options.env)));
                }
                else {
                    env = qs.parse(options.env);
                }
            }

            await daemon.start({
                script: p.resolve(process.cwd(), script),
                name: _.isFunction(options.name) ? p.basename(script, '.js') : options.name, // if no name, name is func in commander
                num: options.num ? Number(options.num) : 1,
                env: env,
                args: args
            });
            await daemon.list();
        });
    });

commander.command('list')
    .description('show all apps')
    .action(async () => {
        await invoke(async () => {
            await daemon.list();
        });
    });

commander.command('restart [app]')
    .description('restart app by [name|id]')
    .action(async app => {
        await invoke(async () => {
            await daemon.restart(app);
            await daemon.list();
        });
    });

commander.command('reload [app]')
    .description('reload app by [name|id]')
    .action(async app => {
        await invoke(async () => {
            await daemon.reload(app);
            await daemon.list();
        });
    });

commander.command('stop [app]')
    .description('stop app by [name|id]')
    .action(async app => {
        await invoke(async () => {
            await daemon.stop(app);
            await daemon.list();
        });
    });

commander.command('rename <from> <to>')
    .description('rename app <from> => <to>')
    .action(async (from, to) => {
        await invoke(async () => {
            await daemon.rename(from, to);
            await daemon.list();
        });
    });

commander.command('reset [name]')
    .description('reset restart count by name')
    .action(async name => {
        await invoke(async () => {
            await daemon.reset(name);
            await daemon.list();
        });
    });

commander.command('post <msg> [app]')
    .description('post message to app by [name|id]')
    .action(async (msg, app) => {
        await invoke(async () => {
            await daemon.post(app, msg);
        });
    });

commander.command('remove [app]')
    .description('remove app by [name|id]')
    .action(async app => {
        await invoke(async () => {
            await daemon.remove(app);
            await daemon.list();
        });
    });

commander.command('log')
    .description('tail app log')
    .action(() => {
        cp.spawn('tail', ['-f', daemon.logPath], {
            stdio: ['ignore', 'inherit', 'ignore']
        });
    });

commander.command('kill')
    .description('kill daemon, all apps will stop')
    .action(async () => {
        await invoke(async () => {
            await daemon.kill();
        });
    });

commander.on('command:*', async () => {
    await invoke(async () => {
        console.log('unsupport command');
    });
});

commander.on('--help', function () {
    console.log('');
    console.log('extends help msg here');
});

commander.parse(process.argv);

if (commander.args.length < 1) {
    (async () => {
        await invoke(async () => {
            await daemon.list();
        });
    })();
}

process.on('uncaughtException', err => {
    console.error(err);
});

async function invoke(fn) {
    try {
        await fn();
    }
    catch (err) {
        console.error(err);
    }

    daemon.disconnect();
}