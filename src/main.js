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
const DOMAIN = 'Main';

log.debug(DOMAIN, 'Passing configuration to components.');
ServerDataExtractor.setConfig(config);
LogsParser.setConfig(config);
log.info(DOMAIN, 'Starting Log Processing');
LogsParser.prepareLogFiles();
LogsParser.parseLogFiles();
log.info(DOMAIN, 'Starting JSON file processing (advancements, stats)');
// TODO use a single JSON parser OR a parser for each filetype??
log.info(DOMAIN, 'Starting NBT data processing (level.dat, playerdata)');
// TODO
