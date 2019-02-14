/**
 * Handles CLI arguments and sets configuration.
 */
import path from 'path';
import fs from 'fs-extra';
import nopt from 'nopt';
import log from './lib/CustomLogger';

const VERSION = require('../package.json').version;
const DOMAIN = 'Configuration';
let defaults = function (arr, def) {
        for (let key in def) {
            if (!arr.hasOwnProperty(key)) {
                arr[key] = def[key];
            }
        }
        return arr;
    },
    rundir = process.cwd(),
    loglevels = ['error', 'warn', 'info', 'debug', 'silly'],
    defaultOpts = {
        minecraft: rundir,
        outputdir: path.join(rundir, 'output'),
        workdir: path.join(rundir, 'mcdata_cache'),
        loglevel: 'info',
        help: false,
        'use-env': false
    },
    knownOpts = {
        minecraft: path,
        outputdir: path,
        workdir: path,
        loglevel: loglevels,
        help: Boolean,
        'use-env': Boolean
    },
    shortHands = {
        silent: ['--loglevel=error'],
        quiet: ['--loglevel=warn'],
        verbose: ['--loglevel=info'],
        debug: ['--loglevel=debug'],
        silly: ['--loglevel=silly'],
        s: ['--loglevel=error'],
        q: ['--loglevel=warn'],
        v: ['--loglevel=info'],
        vvv: ['--loglevel=debug'],
        e: ['--use-env'],
        env: ['--use-env']
    },
    usage = `Usage:
    --help, -h                      Show this help message and exit.
    --minecraft=path                The minecraft folder containing server.properties and world.
    --outputdir=path                The directory to save the generated JSON files into.
    --workdir=path                  The directory to cache data used by this program
    --use-env                       Load configuration values from ENV:
                                        env.MINECRAFT_DIR and env.OUTPUT_DIR
    --loglevel=<level>              How verbose to log to the console. Also you can use one of
                                    the helper functions to accomplish this to varying degrees:
    --silent, -s, --loglevel=error  Log only errors.
    --quiet, -q, --loglevel=warn    Log only warnings and errors.
    -v, --loglevel=info [Default]   Log everything except for debug messages.
    -vvv, -debug, --loglevel=debug  Log everything.`,
    parsedOpts = defaults(
        nopt(knownOpts, shortHands, process.argv, 2),
        defaultOpts
    ),
    helpMessage = `mcdata-to-json ${VERSION}
    A node.js module to turn the data from your minecraft server or world into json.`;

let isValidPath = function (testpath, description) {
    const fileOrDirName = path.basename(testpath);

    try {
        fs.statSync(testpath);
    } catch (err) {
        if (err.code === 'ENOENT') {
            log.debug(`⚠ ${fileOrDirName} not found! (${description})`, DOMAIN);
            return false;
        } else {
            throw err;
        }
    }
    log.debug(`✔ ${fileOrDirName} exists.`, DOMAIN);
    return true;
};

const LOGLEVEL = loglevels.indexOf(parsedOpts.loglevel);

log.setLevel(LOGLEVEL);
log.debug(`current working dir ${rundir}`, DOMAIN);

if (parsedOpts.help) {
    console.log(helpMessage); // eslint-disable-line no-console
    console.log(usage); // eslint-disable-line no-console
    process.exit(0);
}

if (parsedOpts['use-env']) {
    log.debug('use-env flag set, loading config from environment.', DOMAIN);
    log.debug('Process.env vars:', DOMAIN);
    log.debug(`MINECRAFT_DIR: ${process.env.MINECRAFT_DIR}`, DOMAIN);
    log.debug(`OUTPUT_DIR: ${process.env.OUTPUT_DIR}`, DOMAIN);
    log.debug(`WORK_DIR: ${process.env.WORK_DIR}`, DOMAIN);
    if (
        parsedOpts.minecraft === defaultOpts.minecraft &&
        process.env.MINECRAFT_DIR
    ) {
        parsedOpts.minecraft = process.env.MINECRAFT_DIR;
    }
    if (
        !parsedOpts.outputdir === defaultOpts.outputdir &&
        process.env.OUTPUT_DIR
    ) {
        parsedOpts.outputdir = process.env.OUTPUT_DIR;
    }
    if (!parsedOpts.workdir === defaultOpts.workdir && process.env.OUTPUT_DIR) {
        parsedOpts.workdir = process.env.WORK_DIR;
    }
}

// Check minecraft dir is set..
if (!parsedOpts.minecraft) {
    log.error('No minecraft directory set!', DOMAIN);
    process.exit(1);
}
log.debug(`Checking Minecraft dir: ${parsedOpts.minecraft}`, DOMAIN);
// Check for server.properties, to validate minecraft folder..
if (
    isValidPath(
        path.join(parsedOpts.minecraft, 'server.properties'),
        'Minecraft server configuration file'
    )
) {
    parsedOpts.serverproprties = path.join(
        parsedOpts.minecraft,
        'server.properties'
    );
}
if (
    isValidPath(
        path.join(parsedOpts.minecraft, 'client.jar'),
        'Minecraft client jar'
    )
) {
    parsedOpts.mcjar = path.join(parsedOpts.minecraft, 'client.jar');
} else if (
    isValidPath(
        path.join(parsedOpts.minecraft, 'server.jar'),
        'Minecraft server jar'
    )
) {
    parsedOpts.mcjar = path.join(parsedOpts.minecraft, 'server.jar');
} else {
    log.error(
        "Couldn't locate a server.jar or minecraft.jar. Please download and put it in the minecraft directory.",
        DOMAIN
    );
}
if (
    isValidPath(
        path.join(parsedOpts.minecraft, 'world'),
        'Minecraft world directory'
    )
) {
    parsedOpts.worlddir = path.join(parsedOpts.minecraft, 'world');
}
if (
    isValidPath(
        path.join(parsedOpts.minecraft, 'logs'),
        'Minecraft log file directory'
    )
) {
    parsedOpts.logdir = path.join(parsedOpts.minecraft, 'logs');
}
if (
    isValidPath(
        path.join(parsedOpts.minecraft, 'ops.json'),
        'List of OPs on the server.'
    )
) {
    parsedOpts.opsjson = path.join(parsedOpts.minecraft, 'ops.json');
}
if (
    isValidPath(
        path.join(parsedOpts.minecraft, 'usercache.json'),
        'Cache connecting UUIDs to player names.'
    )
) {
    parsedOpts.usercachejson = path.join(parsedOpts.minecraft, 'usercache.json');
}
// Check for valid paths inside world dir
if (
    isValidPath(
        path.join(parsedOpts.worlddir, 'level.dat'),
        'World data file. Found in world directory.'
    )
) {
    parsedOpts.leveldat = path.join(parsedOpts.worlddir, 'level.dat');
}
if (
    isValidPath(
        path.join(parsedOpts.worlddir, 'advancements'),
        'Player advancement progress. Found in world directory.'
    )
) {
    parsedOpts.advancements = path.join(parsedOpts.worlddir, 'advancements');
}
if (
    isValidPath(
        path.join(parsedOpts.worlddir, 'data'),
        'Additional world data files. Found in world directory.'
    )
) {
    parsedOpts.worlddata = path.join(parsedOpts.worlddir, 'data');
}
if (
    isValidPath(
        path.join(parsedOpts.worlddir, 'datapacks'),
        'Found in world directory.'
    )
) {
    parsedOpts.datapacks = path.join(parsedOpts.worlddir, 'datapacks');
}
if (
    isValidPath(
        path.join(parsedOpts.worlddir, 'playerdata'),
        'Contains player info. Found in world directory.'
    )
) {
    parsedOpts.playerdata = path.join(parsedOpts.worlddir, 'playerdata');
}
if (
    isValidPath(
        path.join(parsedOpts.worlddir, 'stats'),
        'Contains player stats. Found in world directory.'
    )
) {
    parsedOpts.stats = path.join(parsedOpts.worlddir, 'stats');
}
if (
    isValidPath(
        path.join(parsedOpts.worlddir, 'region'),
        'Overworld region files. Found in world directory.'
    )
) {
    parsedOpts.overworld = path.join(parsedOpts.worlddir, 'region');
}
if (
    isValidPath(
        path.join(parsedOpts.worlddir, 'DIM1'),
        'The End dir. Found in world directory.'
    )
) {
    if (
        isValidPath(
            path.join(parsedOpts.worlddir, 'DIM1', 'region'),
            'The End region files. Found in world directory.'
        )
    ) {
        parsedOpts.end = path.join(parsedOpts.worlddir, 'DIM1', 'region');
    }
    if (
        isValidPath(
            path.join(parsedOpts.worlddir, 'DIM1', 'data'),
            'The End data files. Found in world directory.'
        )
    ) {
        parsedOpts.enddata = path.join(parsedOpts.worlddir, 'DIM1', 'data');
    }
}
if (
    isValidPath(
        path.join(parsedOpts.worlddir, 'DIM-1'),
        'Nether dir. Found in world directory.'
    )
) {
    if (
        isValidPath(
            path.join(parsedOpts.worlddir, 'DIM-1', 'region'),
            'Nether region files. Found in world directory.'
        )
    ) {
        parsedOpts.nether = path.join(parsedOpts.worlddir, 'DIM-1', 'region');
    }
    if (
        isValidPath(
            path.join(parsedOpts.worlddir, 'DIM-1', 'data'),
            'Nether data files. Found in world directory.'
        )
    ) {
        parsedOpts.netherdata = path.join(parsedOpts.worlddir, 'DIM-1', 'data');
    }
}
log.info('Validated minecraft directory.', DOMAIN);

const MC_DIR = parsedOpts.minecraft,
    PROPERTIES_FILE = parsedOpts.serverproprties,
    USERCACHE_FILE = parsedOpts.usercachejson,
    OPSLIST_FILE = parsedOpts.opsjson,
    MCJAR_FILE = parsedOpts.mcjar,
    LOGS_DIR = parsedOpts.logdir,
    WORLD_DIR = parsedOpts.worlddir,
    WORLDDATA_DIR = parsedOpts.worlddata,
    DATAPACKS_DIR = parsedOpts.datapacks,
    STATS_DIR = parsedOpts.stats,
    ADVANCEMENTS_DIR = parsedOpts.advancements,
    PLAYERDATA_DIR = parsedOpts.playerdata,
    LEVELDAT_FILE = parsedOpts.leveldat,
    OVERWORLD_DIR = parsedOpts.overworld,
    NETHER_DIR = parsedOpts.nether,
    NETHERDATA_DIR = parsedOpts.netherdata,
    END_DIR = parsedOpts.end,
    ENDDATA_DIR = parsedOpts.enddata,
    OUTPUT_DIR = parsedOpts.outputdir,
    WORK_DIR = parsedOpts.workdir,
    TEMP_DIR = path.join(WORK_DIR, '.temp'),
    EXTRACTED_DIR = path.join(WORK_DIR, 'extracted'),
    DATA_DIR = path.join(EXTRACTED_DIR, 'data'),
    ASSETS_DIR = path.join(EXTRACTED_DIR, 'assets');

fs.ensureDirSync(OUTPUT_DIR);
fs.ensureDirSync(WORK_DIR);
fs.ensureDirSync(EXTRACTED_DIR);
fs.ensureDirSync(TEMP_DIR);
fs.ensureDirSync(DATA_DIR);
fs.ensureDirSync(ASSETS_DIR);
log.debug(`Set output dir: ${OUTPUT_DIR}`, DOMAIN);

let playerdatFiles = fs.readdirSync(PLAYERDATA_DIR),
    players = {};

if (USERCACHE_FILE) {
    for (let p of fs.readJSONSync(USERCACHE_FILE)) {
        log.debug(`Discovered cached player: ${p.name} ${p.uuid}`, DOMAIN);
        players[p.uuid] = p.name;
    }
}

for (let f of playerdatFiles) {
    if (f.indexOf('.dat') > -1) {
        let uuid = f.replace(/.dat/, '');

        if (!players[uuid]) {
            players[uuid] = `no-name${f.substr(f.length - 5, 1)}`;
            log.debug(`Discovered un-cached player UUID: ${uuid}`, DOMAIN);
        }
    }
}
const PLAYERS = players;

log.debug(`Registered ${Object.keys(PLAYERS).length} players.`, DOMAIN);

export default {
    MC_DIR,
    PROPERTIES_FILE,
    USERCACHE_FILE,
    OPSLIST_FILE,
    MCJAR_FILE,
    LOGS_DIR,
    WORLD_DIR,
    WORLDDATA_DIR,
    DATAPACKS_DIR,
    STATS_DIR,
    ADVANCEMENTS_DIR,
    PLAYERDATA_DIR,
    LEVELDAT_FILE,
    OVERWORLD_DIR,
    NETHER_DIR,
    NETHERDATA_DIR,
    END_DIR,
    ENDDATA_DIR,
    OUTPUT_DIR,
    WORK_DIR,
    TEMP_DIR,
    EXTRACTED_DIR,
    DATA_DIR,
    ASSETS_DIR,
    PLAYERS
};