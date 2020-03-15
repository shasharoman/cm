const fs = require('fs');

const C = require('../../const');

const env = process.env;

if (env.args) {
    process.argv = process.argv.concat(process.env.args.split(' '));
}

if (env.name) {
    process.title = `CM ${env.name}`;
}

process.chdir(process.cwd());

let logStream = fs.createWriteStream(C.APP_LOG, {
    flags: 'a'
});

logStream.on('open', () => {
    process.stdout.write = (...args) => logStream.write(...args);

    process.stderr.write = (...args) => logStream.write(...args);

    process.on('uncaughtException', err => {
        logStream.write(err.stack + '\n');

        setTimeout(() => {
            process.exit(1);
        }, 100);
    });

    require(env.script);
});