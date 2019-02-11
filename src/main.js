/**
 * You need to set the minecraft folder location in the MC_DIR env variable
 * or use the --minecraft="" parameter when running.
 *
 * By default will output in the current directory, or the OUTPUT_DIR env
 * variable, OR the --outdir="" parameter.
 */
import log from './lib/CustomLogger';
import config from './lib/Configuration';
import LogsParser from './LogsParser';
import ServerDataExtractor from './lib/ServerDataExtractor';
import AdvancementParser from './AdvancementParser';
import MojangApi from './lib/MojangApi';

const DOMAIN = 'Main';

if (!config.MCJAR_FILE) {
    log.error('We expect to have a Minecraft server or client jar in the Minecraft directory.', DOMAIN);
    process.exit(1);
}

log.info('Check for cache of Minecraft data.', DOMAIN);
if (!ServerDataExtractor.checkForData()) {
    log.info('No cached data exists.', DOMAIN);
    log.warn('Quitting after data extracted.', DOMAIN);
    ServerDataExtractor.extractMinecraftDataPromise()
        .then((val) => {
            log.debug(`Data export promise returned ${val}`, DOMAIN);
            ServerDataExtractor.extractMinecraftAssetsPromise();
        }).then((val) => {
            log.debug(`Asset export promise returned ${val}`, DOMAIN);
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
}
// log.info('Starting JSON file processing (advancements, stats)', DOMAIN);

// log.info('Starting NBT data processing (level.dat, playerdata)', DOMAIN);

