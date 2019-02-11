"use strict";

var _CustomLogger = _interopRequireDefault(require("./lib/CustomLogger"));

var _Configuration = _interopRequireDefault(require("./lib/Configuration"));

var _LogsParser = _interopRequireDefault(require("./LogsParser"));

var _ServerDataExtractor = _interopRequireDefault(require("./lib/ServerDataExtractor"));

var _AdvancementParser = _interopRequireDefault(require("./AdvancementParser"));

var _MojangApi = _interopRequireDefault(require("./lib/MojangApi"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * You need to set the minecraft folder location in the MC_DIR env variable
 * or use the --minecraft="" parameter when running.
 *
 * By default will output in the current directory, or the OUTPUT_DIR env
 * variable, OR the --outdir="" parameter.
 */
var DOMAIN = 'Main';

if (!_Configuration.default.MCJAR_FILE) {
  _CustomLogger.default.error('We expect to have a Minecraft server or client jar in the Minecraft directory.', DOMAIN);

  process.exit(1);
}

_CustomLogger.default.info('Check for cache of Minecraft data.', DOMAIN);

if (!_ServerDataExtractor.default.checkForData()) {
  _CustomLogger.default.info('No cached data exists.', DOMAIN);

  _CustomLogger.default.warn('Quitting after data extracted.', DOMAIN);

  _ServerDataExtractor.default.extractMinecraftDataPromise().then(function (val) {
    _CustomLogger.default.debug("Data export promise returned ".concat(val), DOMAIN);

    _ServerDataExtractor.default.extractMinecraftAssetsPromise();
  }).then(function (val) {
    _CustomLogger.default.debug("Asset export promise returned ".concat(val), DOMAIN);
  }).catch(function (val) {
    _CustomLogger.default.error(val, DOMAIN);
  });
} else {
  _CustomLogger.default.info('Cached data exists.', DOMAIN);

  _CustomLogger.default.info('Lazily updating cached player profiles.', DOMAIN);

  _MojangApi.default.lazyProfileUpdate();

  _CustomLogger.default.info('Starting log file processing.', DOMAIN);

  _LogsParser.default.prepareLogFiles();

  _LogsParser.default.parseLogFiles();
} // log.info('Starting JSON file processing (advancements, stats)', DOMAIN);
// log.info('Starting NBT data processing (level.dat, playerdata)', DOMAIN);