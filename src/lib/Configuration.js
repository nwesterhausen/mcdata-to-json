/**
 * Handles CLI arguments and sets configuration.
 */
import path from 'path';
import fs from 'fs-extra';
import nopt from 'nopt';
import log from './CustomLogger';
import version from '../data/Version';
import { defaults } from 'lodash';

const DOMAIN = 'Configuration';
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

const LOGLEVEL = (loglevels.indexOf(parsedOpts.loglevel));

log.setLevel(LOGLEVEL);

log.debug('Process.env vars:', DOMAIN);
log.debug(`MINECRAFT_DIR: ${ process.env.MINECRAFT_DIR }`, DOMAIN);
log.debug(`OUTPUT_DIR: ${ process.env.OUTPUT_DIR }`, DOMAIN);

if (parsedOpts.help) {
    console.log(helpMessage); // eslint-disable-line no-console
    console.log(usage); // eslint-disable-line no-console
    process.exit(0);
}
if (parsedOpts['use-env']) {
    log.debug('Trying to load values from environment.', DOMAIN);
    if (parsedOpts.minecraft === defaultOpts.minecraft && process.env.MINECRAFT_DIR) {
        parsedOpts.minecraft = process.env.MINECRAFT_DIR;
    }
    if (!parsedOpts.outputdir === defaultOpts.outputdir && process.env.OUTPUT_DIR) {
        parsedOpts.outputdir = process.env.OUTPUT_DIR;
    }
}


log.debug(`current working dir ${ rundir}`, DOMAIN);

const MC_DIR = parsedOpts.minecraft,
    PROPERTIES_FILE = path.join(MC_DIR, 'server.properties'),
    LOGS_DIR = path.join(MC_DIR, 'logs'),
    WORLD_DIR = path.join(MC_DIR, 'world'),
    STATS_DIR = path.join(WORLD_DIR, 'stats'),
    ADVANCEMENTS_DIR = path.join(WORLD_DIR, 'advancements'),
    PLAYERDATA_DIR = path.join(WORLD_DIR, 'playerdata'),
    OUTPUT_DIR = parsedOpts.outputdir,
    TEMP_DIR = path.join(OUTPUT_DIR, 'temp'),
    DATA_DIR = path.join(OUTPUT_DIR, 'data'),
    ASSETS_DIR = path.join(OUTPUT_DIR, 'assets');

if (!MC_DIR) {
    log.error('No minecraft directory set!', DOMAIN);
    process.exit(1);
}
log.info(`Set Minecraft dir: ${ MC_DIR }`, DOMAIN);
// Check for server.properties, to validate minecraft folder..
try {
    fs.statSync(PROPERTIES_FILE);
    fs.statSync(WORLD_DIR);
    fs.statSync(LOGS_DIR);
} catch (err) {
    if (err.code === 'ENOENT') {
        let testedPath = path.basename(err.path);

        log.error(`No ${ testedPath } found in Minecraft dir!`, DOMAIN);
        process.exit(1);
    } else {
        throw err;
    }
}
// Check for items with the world directory
try {
    fs.statSync(STATS_DIR);
    fs.statSync(ADVANCEMENTS_DIR);
    fs.statSync(PLAYERDATA_DIR);
} catch (err) {
    if (err.code === 'ENOENT') {
        let testedPath = path.basename(err.path);

        log.error(`No ${ testedPath } found in Minecraft world dir!`, DOMAIN);
        process.exit(1);
    } else {
        throw err;
    }
}
log.info('Minecraft dir passed validation checks.', DOMAIN);

fs.ensureDirSync(OUTPUT_DIR);
fs.ensureDirSync(TEMP_DIR);
fs.ensureDirSync(DATA_DIR);
fs.ensureDirSync(ASSETS_DIR);
log.info(`Set output dir: ${OUTPUT_DIR}`, DOMAIN);

let playerdatFiles = fs.readdirSync(PLAYERDATA_DIR),
    players = [];

for (let f of playerdatFiles) {
    if (f.indexOf('.dat') > -1) {
        players.push(f.split('.dat')[0]);
        log.debug(`Discovered player UUID: ${f.split('.dat')[0]}`, DOMAIN);
    }
}
const PLAYERS = players;

log.info(`Registered ${PLAYERS.length} players.`, DOMAIN);

export default {
    MC_DIR,
    PROPERTIES_FILE,
    LOGS_DIR,
    WORLD_DIR,
    ADVANCEMENTS_DIR,
    STATS_DIR,
    PLAYERDATA_DIR,
    OUTPUT_DIR,
    TEMP_DIR,
    DATA_DIR,
    ASSETS_DIR,
    LOGLEVEL,
    PLAYERS
};
