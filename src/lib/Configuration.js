/**
 * Handles CLI arguments and sets configuration.
 */
import path from 'path';
import fs from 'fs-extra';
import nopt from 'nopt';
import noptUsage from 'nopt-usage';
import log from './CustomLogger';
import version from '../data/Version';
import { defaults } from 'lodash';

// Grab any CLI arguments
let rundir = path.dirname(process.argv[1]),
    loglevels = ['error', 'warn', 'info', 'debug'],
    optDescriptions = {
        'minecraft': 'The minecraft folder containing server.properties and world',
        'outputdir': 'The dir to put the created JSON into.',
        'loglevel': 'How verbose to log to console.',
        'help': 'Show the help message.'
    },
    defaultOpts = {
        'minecraft': rundir,
        'outputdir': path.join(rundir, 'output'),
        'loglevel': 'info',
        'help': false
    },
    knownOpts = {
        'minecraft': path,
        'outputdir': path,
        'loglevel': loglevels,
        'help': Boolean
    },
    shortHands = {
        'silent': ['--loglevel=error'],
        'quiet': ['--loglevel=warn'],
        'verbose': ['--loglevel=info'],
        'debug': ['--loglevel=debug'],
        's': ['--loglevel=error'],
        'q': ['--loglevel=warn'],
        'v': ['--loglevel=info'],
        'vvv': ['--loglevel=debug']
    },
    usage = noptUsage(knownOpts, shortHands, optDescriptions, defaultOpts),
    parsedOpts = defaults(nopt(knownOpts, shortHands, process.argv, 2), defaultOpts),
    helpMessage = `mcdata-to-json ${ version.version }
    A node.js module to turn the data from your minecraft server or world into json.`;

if (parsedOpts.help) {
    console.log(helpMessage);
    console.log('Usage: ');
    console.log(usage);
    process.exit(0);
}

log.setLevel(loglevels.indexOf(parsedOpts.loglevel));

log.debug(`current working dir ${ rundir}`);

const MC = parsedOpts.minecraft,
    PROPERTIES_FILE = path.join(MC, 'server.properties'),
    LOGS = path.join(MC, 'logs'),
    WORLD = path.join(MC, 'world'),
    STATS = path.join(WORLD, 'stats'),
    ADVANCEMENTS = path.join(WORLD, 'advancements'),
    PLAYERDATA = path.join(WORLD, 'playerdata'),
    OUTPUT_DIR = parsedOpts.outputdir,
    TEMP_DIR = path.join(OUTPUT_DIR, 'temp');

if (!MC) {
    log.error('No minecraft directory set!');
    process.exit(1);
}
log.debug(`argument --minecraft ${ parsedOpts.minecraft }`);
log.debug(`environemnt.MC_DIR ${ process.env.MC_DIR}`);
log.info(`Set Minecraft dir: ${ MC}`);
// Check for server.properties, to validate minecraft folder..
try {
    fs.statSync(PROPERTIES_FILE);
    fs.statSync(WORLD);
    fs.statSync(LOGS);
} catch (err) {
    if (err.code === 'ENOENT') {
        let testedPath = path.basename(err.path);

        log.error(`No ${ testedPath } found in Minecraft dir!`);
        process.exit(1);
    } else {
        throw err;
    }
}
// Check for items with the world directory
try {
    fs.statSync(ADVANCEMENTS);
    fs.statSync(STATS);
    fs.statSync(PLAYERDATA);
} catch (err) {
    if (err.code === 'ENOENT') {
        let testedPath = path.basename(err.path);

        log.error(`No ${ testedPath } found in Minecraft world dir!`);
        process.exit(1);
    } else {
        throw err;
    }
}
log.info('Minecraft dir passed validation checks.');

log.debug(`argument --outdir ${ parsedOpts.outputdir }`);
log.debug(`environemnt.OUTPUT_DIR ${ process.env.OUTPUT_DIR}`);
fs.ensureDirSync(OUTPUT_DIR);
fs.ensureDirSync(TEMP_DIR);
log.info(`Set output dir: ${OUTPUT_DIR}`);

export default {
    MC,
    PROPERTIES_FILE,
    LOGS,
    WORLD,
    ADVANCEMENTS,
    STATS,
    PLAYERDATA,
    OUTPUT_DIR,
    TEMP_DIR
};
