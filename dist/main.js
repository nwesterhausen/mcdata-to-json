"use strict";

var _CustomLogger = _interopRequireDefault(require("./lib/CustomLogger"));

var _Configuration = _interopRequireDefault(require("./lib/Configuration"));

var _LogsParser = _interopRequireDefault(require("./LogsParser"));

var _ServerDataExtractor = _interopRequireDefault(require("./lib/ServerDataExtractor"));

var _AdvancementParser = _interopRequireDefault(require("./AdvancementParser"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * You need to set the minecraft folder location in the MC_DIR env variable
 * or use the --minecraft="" parameter when running.
 *
 * By default will output in the current directory, or the OUTPUT_DIR env
 * variable, OR the --outdir="" parameter.
 */
var DOMAIN = 'Main';

var sleep = require('system-sleep');

_CustomLogger.default.debug('Passing configuration to components.', DOMAIN);

_ServerDataExtractor.default.setConfig(_Configuration.default);

_LogsParser.default.setConfig(_Configuration.default);

_AdvancementParser.default.setConfig(_Configuration.default);

_CustomLogger.default.info('Starting Log Processing', DOMAIN);

_LogsParser.default.prepareLogFiles();

_LogsParser.default.parseLogFiles();

_CustomLogger.default.debug("ServerDataExtractor.getBusy(): ".concat(_ServerDataExtractor.default.getBusy()), DOMAIN);

if (_ServerDataExtractor.default.getBusy()) {
  _CustomLogger.default.info('Waiting for minecraft data extraction to complete.', DOMAIN);

  while (_ServerDataExtractor.default.getBusy()) {
    sleep(1000);
  }
}

_CustomLogger.default.info('Starting JSON file processing (advancements, stats)', DOMAIN);

_CustomLogger.default.info('Starting NBT data processing (level.dat, playerdata)', DOMAIN);