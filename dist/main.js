"use strict";

var _CustomLogger = _interopRequireDefault(require("./lib/CustomLogger"));

var _Configuration = _interopRequireDefault(require("./lib/Configuration"));

var _LogsParser = _interopRequireDefault(require("./LogsParser"));

var _ServerDataTool = _interopRequireDefault(require("./lib/ServerDataTool"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * You need to set the minecraft folder location in the MC_DIR env variable
 * or use the --minecraft="" parameter when running.
 *
 * By default will output in the current directory, or the OUTPUT_DIR env
 * variable, OR the --outdir="" parameter.
 */
var DOMAIN = 'Main';

_CustomLogger.default.info(DOMAIN, "Beginning log read from ".concat(_Configuration.default.LOGS));

_LogsParser.default.setDirs(_Configuration.default.LOGS, _Configuration.default.TEMP_DIR);

_LogsParser.default.prepareLogFiles();

_LogsParser.default.parseLogFiles();

_ServerDataTool.default.setMinecraftRoot(_Configuration.default.MC);

_ServerDataTool.default.setTempRoot(_Configuration.default.TEMP_DIR);

_ServerDataTool.default.exportMinecraftAdvancements();