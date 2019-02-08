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

const DOMAIN = 'Main';
const sleep = require( 'system-sleep' );

log.debug('Passing configuration to components.', DOMAIN);
ServerDataExtractor.setConfig(config);
LogsParser.setConfig(config);
AdvancementParser.setConfig(config);
log.info('Starting Log Processing', DOMAIN);
LogsParser.prepareLogFiles();
LogsParser.parseLogFiles();
log.debug(`ServerDataExtractor.getBusy(): ${ServerDataExtractor.getBusy()}`, DOMAIN);
if (ServerDataExtractor.getBusy()) {
    log.info('Waiting for minecraft data extraction to complete.', DOMAIN);
    while (ServerDataExtractor.getBusy()) {
        sleep(1000);
    }
}
log.info('Starting JSON file processing (advancements, stats)', DOMAIN);

log.info('Starting NBT data processing (level.dat, playerdata)', DOMAIN);

