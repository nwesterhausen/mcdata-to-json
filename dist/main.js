"use strict";

var _CustomLogger = _interopRequireDefault(require("./lib/CustomLogger"));

var _Configuration = _interopRequireDefault(require("./lib/Configuration"));

var _LogsParser = _interopRequireDefault(require("./LogsParser"));

var _AdvancementLoader = _interopRequireDefault(require("./lib/AdvancementLoader"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * You need to set the minecraft folder location in the MC_DIR env variable
 * or use the --minecraft="" parameter when running.
 *
 * By default will output in the current directory, or the OUTPUT_DIR env
 * variable, OR the --outdir="" parameter.
 */
_CustomLogger.default.info("Beginning log read from ".concat(_Configuration.default.LOGS));

_LogsParser.default.setDirs(_Configuration.default.LOGS, _Configuration.default.TEMP_DIR);

_LogsParser.default.prepareLogFiles();

_LogsParser.default.parseLogFiles();

_AdvancementLoader.default.setMinecraftRoot(_Configuration.default.MC);

_AdvancementLoader.default.setTempRoot(_Configuration.default.TEMP_DIR);

_AdvancementLoader.default.exportMinecraftAdvancements();