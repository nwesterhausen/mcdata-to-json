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

log.info('Check for cache of Minecraft data.', DOMAIN);
if (!ServerDataExtractor.checkForData()) {
    log.info('No cached data exists.', DOMAIN);
    log.warn('Quitting after data extracted.', DOMAIN);
    ServerDataExtractor.extractMinecraftDataPromise()
        .then((val) => {
            log.debug(`Data export promise returned ${val}`, DOMAIN);
            log.info('Completed export of minecraft data.', DOMAIN);
            process.exit(0);
        }).catch( (val) => {
            log.error(val, DOMAIN);
        });
} else {
    log.info('Cached data exists.', DOMAIN);
    log.info('Lazily updating cached player profiles.', DOMAIN);
    MojangApi.lazyProfileUpdate();
    log.info('Starting log file processing.', DOMAIN);
}
// log.info('Starting Log Processing', DOMAIN);
// LogsParser.prepareLogFiles();
// LogsParser.parseLogFiles();
// log.debug(`ServerDataExtractor.getBusy(): ${ServerDataExtractor.getBusy()}`, DOMAIN);
// if (ServerDataExtractor.getBusy()) {
//     log.info('Waiting for minecraft data extraction to complete.', DOMAIN);
//     while (ServerDataExtractor.getBusy()) {
//         sleep(1000);
//     }
// }
// log.info('Starting JSON file processing (advancements, stats)', DOMAIN);

// log.info('Starting NBT data processing (level.dat, playerdata)', DOMAIN);

