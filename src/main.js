/**
 * You need to set the minecraft folder location in the MC_DIR env variable
 * or use the --minecraft="" parameter when running.
 *
 * By default will output in the current directory, or the OUTPUT_DIR env
 * variable, OR the --outdir="" parameter.
 */
import log from './lib/CustomLogger';
import Config from './lib/Configuration';
import PlayerDataCombiner from './lib/PlayerDataCombiner';
import LogsParser from './LogsParser';
import ServerDataExtractor from './lib/ServerDataExtractor';
import MCAConverter from './lib/MCAConverter';
// import AdvancementParser from './AdvancementParser';
import DatParser from './DatParser';
import MojangApi from './lib/MojangApi';
import fs from 'fs-extra';
import path from 'path';

const DOMAIN = 'Main';

if (!Config.MCJAR_FILE) {
    log.error('We expect to have a Minecraft server or client jar in the Minecraft directory.', DOMAIN);
    process.exit(1);
}

log.info('Check for cache of Minecraft data.', DOMAIN);
if (!ServerDataExtractor.checkForData()) {
    log.info('No cached data exists.', DOMAIN);
    log.warn('Quitting after data extracted.', DOMAIN);
    let promises = [];

    promises.push(ServerDataExtractor.extractMinecraftAssetsPromise());
    promises.push(ServerDataExtractor.extractMinecraftDataPromise());

    if (Config.DATAPACKS_DIR) {
        let possibleDPs = fs.readdirSync(Config.DATAPACKS_DIR);

        for (let i = 0; i < possibleDPs.length; i++) {
            promises.push(ServerDataExtractor.extractPromise(path.join(Config.DATAPACKS_DIR, possibleDPs[i]), Config.EXTRACTED_DIR));
        }
    }

    Promise.all(promises).then((val) => {
        log.debug(`Promise returned ${val}`, DOMAIN);
    }).catch( (val) => {
        log.error(val, DOMAIN);
    });
} else {
    log.info('Cached data exists.', DOMAIN);
    log.info('Lazily updating cached player profiles.', DOMAIN);
    MojangApi.lazyProfileUpdate();
    log.info('Starting log file processing.', DOMAIN);
    LogsParser.prepareLogFiles();
    LogsParser.parseLogFiles();
    DatParser.parsePlayerdata();
    for (let i = 0; i < Object.keys(Config.PLAYERS).length; i++) {
        PlayerDataCombiner.combinePlayerData(Object.keys(Config.PLAYERS)[i]);
    }
    let mcaReadingPromises = [],
        overworldRegionFiles = fs.readdirSync(Config.OVERWORLD_DIR);
    
    for (let i in overworldRegionFiles) {
        let regionFile = overworldRegionFiles[i];

        mcaReadingPromises.push(MCAConverter.parseMCAPromise(path.join(Config.OVERWORLD_DIR, regionFile)));
    }
    log.info(`Beginning parse of ${mcaReadingPromises.length} overworld region files. This may take a while!`);
    Promise.all(mcaReadingPromises).then((val) => {
        log.info('Completed parse of overworld region files', DOMAIN);
        log.debug(`Promise returned ${val}.`, DOMAIN);
    }).catch((err) => {
        log.error(err, DOMAIN);
    });
    let mcaNetherReadingPromises = [],
        netherRegionFiles = fs.readdirSync(Config.NETHER_DIR);
    
    for (let i in netherRegionFiles) {
        let regionFile = netherRegionFiles[i];

        mcaNetherReadingPromises.push(MCAConverter.parseMCAPromise(path.join(Config.NETHER_DIR, regionFile)));
    }
    log.info(`Beginning parse of ${mcaNetherReadingPromises.length} nether region files. This may take a while!`);
    Promise.all(mcaNetherReadingPromises).then((val) => {
        log.info('Completed parse of nether region files', DOMAIN);
        log.debug(`Promise returned ${val}.`, DOMAIN);
    }).catch((err) => {
        log.error(err, DOMAIN);
    });
}
// log.info('Starting JSON file processing (advancements, stats)', DOMAIN);

// log.info('Starting NBT data processing (level.dat, playerdata)', DOMAIN);

