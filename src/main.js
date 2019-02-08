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
import a from './lib/ServerDataTool';
const DOMAIN = 'Main';

log.info(DOMAIN, `Beginning log read from ${config.LOGS}`);
LogsParser.setDirs(config.LOGS, config.TEMP_DIR);
LogsParser.prepareLogFiles();
LogsParser.parseLogFiles();
a.setMinecraftRoot(config.MC);
a.setTempRoot(config.TEMP_DIR);
a.exportMinecraftAdvancements();
