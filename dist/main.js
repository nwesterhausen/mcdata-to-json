"use strict";

var _CustomLogger = _interopRequireDefault(require("./lib/CustomLogger"));

var _Configuration = _interopRequireDefault(require("./lib/Configuration"));

var _LogsParser = _interopRequireDefault(require("./LogsParser"));

var _ServerDataExtractor = _interopRequireDefault(require("./lib/ServerDataExtractor"));

var _AdvancementParser = _interopRequireDefault(require("./AdvancementParser"));

var _MojangApi = _interopRequireDefault(require("./lib/MojangApi"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _path = _interopRequireDefault(require("path"));

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

  var promises = [];
  promises.push(_ServerDataExtractor.default.extractMinecraftAssetsPromise());
  promises.push(_ServerDataExtractor.default.extractMinecraftDataPromise());

  if (_Configuration.default.DATAPACKS_DIR) {
    var possibleDPs = _fsExtra.default.readdirSync(_Configuration.default.DATAPACKS_DIR);

    for (var i = 0; i < possibleDPs.length; i++) {
      promises.push(_ServerDataExtractor.default.extractPromise(_path.default.join(_Configuration.default.DATAPACKS_DIR, possibleDPs[i]), _Configuration.default.EXTRACTED_DIR));
    }
  }

  Promise.all(promises).then(function (val) {
    _CustomLogger.default.debug("Promise returned ".concat(val), DOMAIN);
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