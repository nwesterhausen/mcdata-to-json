/**
 * Handles CLI arguments and sets configuration.
 */
import path from 'path';
import fs from 'fs-extra';
import nopt from 'nopt';
import log from './CustomLogger';
import version from '../data/Version';
import { defaults } from 'lodash';

// Grab any CLI arguments
let rundir = path.dirname(process.argv[1]),
    loglevels = ['error', 'warn', 'info', 'debug'],
    defaultOpts = {
        'minecraft': rundir,
        'outputdir': path.join(rundir, 'output'),
        'loglevel': 'info',
        'help': false,
        'use-env': false
    },
    knownOpts = {
        'minecraft': path,
        'outputdir': path,
        'loglevel': loglevels,
        'help': Boolean,
        'use-env': Boolean
    },
    shortHands = {
        'silent': ['--loglevel=error'],
        'quiet': ['--loglevel=warn'],
        'verbose': ['--loglevel=info'],
        'debug': ['--loglevel=debug'],
        's': ['--loglevel=error'],
        'q': ['--loglevel=warn'],
        'v': ['--loglevel=info'],
        'vvv': ['--loglevel=debug'],
        'e': ['--use-env'],
        'env': ['--use-env']
    },
    usage = `Usage:
    --help, -h                      Show this help message and exit.
    --minecraft=path                The minecraft folder containing server.properties and world.
    --outputdir=path                The directory to save the generated JSON files into.
    --use-env                       Load configuration values from ENV:
                                        env.MINECRAFT_DIR and env.OUTPUT_DIR
    --loglevel=<level>              How verbose to log to the console. Also you can use one of
                                    the helper functions to accomplish this to varying degrees:
    --silent, -s, --loglevel=error  Log only errors.
    --quiet, -q, --loglevel=warn    Log only warnings and errors.
    -v, --loglevel=info [Default]   Log everything except for debug messages.
    -vvv, -debug, --loglevel=debug  Log everything.`,
    parsedOpts = defaults(nopt(knownOpts, shortHands, process.argv, 2), defaultOpts),
    helpMessage = `mcdata-to-json ${ version.version }
    A node.js module to turn the data from your minecraft server or world into json.`;

if (parsedOpts.help) {
    console.log(helpMessage);
    console.log(usage);
    process.exit(0);
}
if (parsedOpts["use-env"]) {
    if (!parsedOpts.minecraft && process.env.MINECRAFT_DIR) {
        parsedOpts.minecraft = process.env.MINECRAFT_DIR;
    }
    if (!parsedOpts.outputdir && process.env.OUTPUT_DIR) {
        parsedOpts.outputdir = process.env.OUTPUT_DIR;
    }
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
log.debug(`environemnt.MC_DIR ${ process.env.MC_DIR }`);
log.info(`Set Minecraft dir: ${ MC }`);
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
log.debug(`environemnt.OUTPUT_DIR ${ process.env.OUTPUT_DIR }`);
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
