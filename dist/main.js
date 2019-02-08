"use strict";

var _CustomLogger = _interopRequireDefault(require("./lib/CustomLogger"));

var _Configuration = _interopRequireDefault(require("./lib/Configuration"));

var _LogsParser = _interopRequireDefault(require("./LogsParser"));

var _ServerDataExtractor = _interopRequireDefault(require("./lib/ServerDataExtractor"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * You need to set the minecraft folder location in the MC_DIR env variable
 * or use the --minecraft="" parameter when running.
 *
 * By default will output in the current directory, or the OUTPUT_DIR env
 * variable, OR the --outdir="" parameter.
 */
var DOMAIN = 'Main';

_CustomLogger.default.debug(DOMAIN, 'Passing configuration to components.');

_ServerDataExtractor.default.setConfig(_Configuration.default);

_LogsParser.default.setConfig(_Configuration.default);

_CustomLogger.default.info(DOMAIN, 'Starting Log Processing');

_LogsParser.default.prepareLogFiles();

_LogsParser.default.parseLogFiles();

_CustomLogger.default.info(DOMAIN, 'Starting JSON file processing (advancements, stats'); // TODO use a single JSON parser OR a parser for each filetype??


_CustomLogger.default.info(DOMAIN, 'Starting NBT data processing (level.dat, playerdata'); // TODO