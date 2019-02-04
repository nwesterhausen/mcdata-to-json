/**
 * Handles CLI arguments and sets configuration.
 */
import {
    dirname,
    join,
    basename
} from 'path';
import {
    statSync
} from 'fs-extra';
import log from './logger';


// Grab any CLI arguments
let paramMcdir,
    paramOutdir,
    paramDebug = false,
    paramInfo = false,
    rundir = dirname(process.argv[1]);

process.argv.forEach((val, index) => {
    // console.log(`${index}: ${val}`);
    if (index > 1) {
        let option = val.split('=')[0];

        switch (option) { // eslint-disable-line default-case
            case '--minecraft':
                paramMcdir = val.split('=')[1];
                break;
            case '--outdir':
                paramOutdir = val.split('=')[1];
                break;
            case '--debug':
            case '-vvv':
                paramDebug = true;
            case '--verbose': // eslint-disable-line no-fallthrough
            case '-v':
                paramInfo = true;
                break;
        }
    }
});

log.showDebug(paramDebug || process.env.SHOW_DEBUG);
log.showInfo(paramInfo || process.env.SHOW_INFO);

log.debug(`current working dir ${ rundir}`);

const MC = paramMcdir || process.env.MC_DIR || rundir,
    PROPERTIES_FILE = join(MC, 'server.properties'),
    LOGS = join(MC, 'logs'),
    WORLD = join(MC, 'world'),
    STATS = join(WORLD, 'stats'),
    ADVANCEMENTS = join(WORLD, 'advancements'),
    PLAYERDATA = join(WORLD, 'playerdata'),
    OUTPUT_DIR = paramOutdir || process.env.OUTPUT_DIR || rundir;

if (!MC) {
    log.error('No minecraft directory set!');
    process.exit(1);
}
log.debug(`argument --minecraft ${ paramMcdir}`);
log.debug(`environemnt.MC_DIR ${ process.env.MC_DIR}`);
log.info(`Set Minecraft dir: ${ MC}`);
// Check for server.properties, to validate minecraft folder..
try {
    statSync(PROPERTIES_FILE);
    statSync(WORLD);
    statSync(LOGS);
} catch (err) {
    if (err.code === 'ENOENT') {
        let testedPath = basename(err.path);

        log.error(`No ${ testedPath } found in Minecraft dir!`);
        process.exit(1);
    } else {
        throw err;
    }
}
// Check for items with the world directory
try {
    statSync(ADVANCEMENTS);
    statSync(STATS);
    statSync(PLAYERDATA);
} catch (err) {
    if (err.code === 'ENOENT') {
        let testedPath = basename(err.path);

        log.error(`No ${ testedPath } found in Minecraft world dir!`);
        process.exit(1);
    } else {
        throw err;
    }
}
log.info('Minecraft dir passed validation checks.');

if (!OUTPUT_DIR) {
    log.error('Failed to set output dir!');
}
log.debug(`argument --outdir ${ paramOutdir}`);
log.debug(`environemnt.OUTPUT_DIR ${ process.env.OUTPUT_DIR}`);
log.info(`Set output dir: ${ OUTPUT_DIR}`);

export default {
    MC,
    PROPERTIES_FILE,
    LOGS,
    WORLD,
    ADVANCEMENTS,
    STATS,
    PLAYERDATA,
    OUTPUT_DIR
};
