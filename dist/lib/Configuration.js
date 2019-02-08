"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = _interopRequireDefault(require("path"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _nopt = _interopRequireDefault(require("nopt"));

var _CustomLogger = _interopRequireDefault(require("./CustomLogger"));

var _Version = _interopRequireDefault(require("../data/Version"));

var _lodash = require("lodash");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Handles CLI arguments and sets configuration.
 */
var DOMAIN = 'Configuration';

var rundir = _path.default.dirname(process.argv[1]),
    loglevels = ['error', 'warn', 'info', 'debug'],
    defaultOpts = {
  'minecraft': rundir,
  'outputdir': _path.default.join(rundir, 'output'),
  'loglevel': 'info',
  'help': false,
  'use-env': false
},
    knownOpts = {
  'minecraft': _path.default,
  'outputdir': _path.default,
  'loglevel': loglevels,
  'help': Boolean,
  'use-env': Boolean
},
    shortHands = {
  'silent': ['--loglevel=error'],
  'quiet': ['--loglevel=warn'],
  'verbose': ['--loglevel=info'],
  'debug': ['--loglevel=debug'],
  's': ['--loglevel=error'],
  'q': ['--loglevel=warn'],
  'v': ['--loglevel=info'],
  'vvv': ['--loglevel=debug'],
  'e': ['--use-env'],
  'env': ['--use-env']
},
    usage = "Usage:\n    --help, -h                      Show this help message and exit.\n    --minecraft=path                The minecraft folder containing server.properties and world.\n    --outputdir=path                The directory to save the generated JSON files into.\n    --use-env                       Load configuration values from ENV:\n                                        env.MINECRAFT_DIR and env.OUTPUT_DIR\n    --loglevel=<level>              How verbose to log to the console. Also you can use one of\n                                    the helper functions to accomplish this to varying degrees:\n    --silent, -s, --loglevel=error  Log only errors.\n    --quiet, -q, --loglevel=warn    Log only warnings and errors.\n    -v, --loglevel=info [Default]   Log everything except for debug messages.\n    -vvv, -debug, --loglevel=debug  Log everything.",
    parsedOpts = (0, _lodash.defaults)((0, _nopt.default)(knownOpts, shortHands, process.argv, 2), defaultOpts),
    helpMessage = "mcdata-to-json ".concat(_Version.default.version, "\n    A node.js module to turn the data from your minecraft server or world into json.");

_CustomLogger.default.setLevel(loglevels.indexOf(parsedOpts.loglevel));

_CustomLogger.default.debug(DOMAIN, 'Process.env vars:');

_CustomLogger.default.debug(DOMAIN, "MINECRAFT_DIR: ".concat(process.env.MINECRAFT_DIR));

_CustomLogger.default.debug(DOMAIN, "OUTPUT_DIR: ".concat(process.env.OUTPUT_DIR));

if (parsedOpts.help) {
  console.log(helpMessage); // eslint-disable-line no-console

  console.log(usage); // eslint-disable-line no-console

  process.exit(0);
}

if (parsedOpts['use-env']) {
  _CustomLogger.default.debug(DOMAIN, 'Trying to load values from environment.');

  if (parsedOpts.minecraft === defaultOpts.minecraft && process.env.MINECRAFT_DIR) {
    parsedOpts.minecraft = process.env.MINECRAFT_DIR;
  }

  if (!parsedOpts.outputdir === defaultOpts.outputdir && process.env.OUTPUT_DIR) {
    parsedOpts.outputdir = process.env.OUTPUT_DIR;
  }
}

_CustomLogger.default.debug(DOMAIN, "current working dir ".concat(rundir));

var MC = parsedOpts.minecraft,
    PROPERTIES_FILE = _path.default.join(MC, 'server.properties'),
    LOGS = _path.default.join(MC, 'logs'),
    WORLD = _path.default.join(MC, 'world'),
    STATS = _path.default.join(WORLD, 'stats'),
    ADVANCEMENTS = _path.default.join(WORLD, 'advancements'),
    PLAYERDATA = _path.default.join(WORLD, 'playerdata'),
    OUTPUT_DIR = parsedOpts.outputdir,
    TEMP_DIR = _path.default.join(OUTPUT_DIR, 'temp');

if (!MC) {
  _CustomLogger.default.error(DOMAIN, 'No minecraft directory set!');

  process.exit(1);
}

_CustomLogger.default.info(DOMAIN, "Set Minecraft dir: ".concat(MC)); // Check for server.properties, to validate minecraft folder..


try {
  _fsExtra.default.statSync(PROPERTIES_FILE);

  _fsExtra.default.statSync(WORLD);

  _fsExtra.default.statSync(LOGS);
} catch (err) {
  if (err.code === 'ENOENT') {
    var testedPath = _path.default.basename(err.path);

    _CustomLogger.default.error(DOMAIN, "No ".concat(testedPath, " found in Minecraft dir!"));

    process.exit(1);
  } else {
    throw err;
  }
} // Check for items with the world directory


try {
  _fsExtra.default.statSync(ADVANCEMENTS);

  _fsExtra.default.statSync(STATS);

  _fsExtra.default.statSync(PLAYERDATA);
} catch (err) {
  if (err.code === 'ENOENT') {
    var _testedPath = _path.default.basename(err.path);

    _CustomLogger.default.error(DOMAIN, "No ".concat(_testedPath, " found in Minecraft world dir!"));

    process.exit(1);
  } else {
    throw err;
  }
}

_CustomLogger.default.info(DOMAIN, 'Minecraft dir passed validation checks.');

_fsExtra.default.ensureDirSync(OUTPUT_DIR);

_fsExtra.default.ensureDirSync(TEMP_DIR);

_CustomLogger.default.info(DOMAIN, "Set output dir: ".concat(OUTPUT_DIR));

var _default = {
  MC: MC,
  PROPERTIES_FILE: PROPERTIES_FILE,
  LOGS: LOGS,
  WORLD: WORLD,
  ADVANCEMENTS: ADVANCEMENTS,
  STATS: STATS,
  PLAYERDATA: PLAYERDATA,
  OUTPUT_DIR: OUTPUT_DIR,
  TEMP_DIR: TEMP_DIR
};
exports.default = _default;