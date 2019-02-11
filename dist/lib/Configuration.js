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

var LOGLEVEL = loglevels.indexOf(parsedOpts.loglevel);

_CustomLogger.default.setLevel(LOGLEVEL);

_CustomLogger.default.debug('Process.env vars:', DOMAIN);

_CustomLogger.default.debug("MINECRAFT_DIR: ".concat(process.env.MINECRAFT_DIR), DOMAIN);

_CustomLogger.default.debug("OUTPUT_DIR: ".concat(process.env.OUTPUT_DIR), DOMAIN);

if (parsedOpts.help) {
  console.log(helpMessage); // eslint-disable-line no-console

  console.log(usage); // eslint-disable-line no-console

  process.exit(0);
}

if (parsedOpts['use-env']) {
  _CustomLogger.default.debug('Trying to load values from environment.', DOMAIN);

  if (parsedOpts.minecraft === defaultOpts.minecraft && process.env.MINECRAFT_DIR) {
    parsedOpts.minecraft = process.env.MINECRAFT_DIR;
  }

  if (!parsedOpts.outputdir === defaultOpts.outputdir && process.env.OUTPUT_DIR) {
    parsedOpts.outputdir = process.env.OUTPUT_DIR;
  }
}

_CustomLogger.default.debug("current working dir ".concat(rundir), DOMAIN);

var MC_DIR = parsedOpts.minecraft,
    PROPERTIES_FILE = _path.default.join(MC_DIR, 'server.properties'),
    LOGS_DIR = _path.default.join(MC_DIR, 'logs'),
    WORLD_DIR = _path.default.join(MC_DIR, 'world'),
    STATS_DIR = _path.default.join(WORLD_DIR, 'stats'),
    ADVANCEMENTS_DIR = _path.default.join(WORLD_DIR, 'advancements'),
    PLAYERDATA_DIR = _path.default.join(WORLD_DIR, 'playerdata'),
    OUTPUT_DIR = parsedOpts.outputdir,
    TEMP_DIR = _path.default.join(OUTPUT_DIR, 'temp'),
    DATA_DIR = _path.default.join(OUTPUT_DIR, 'data'),
    ASSETS_DIR = _path.default.join(OUTPUT_DIR, 'assets');

if (!MC_DIR) {
  _CustomLogger.default.error('No minecraft directory set!', DOMAIN);

  process.exit(1);
}

_CustomLogger.default.info("Set Minecraft dir: ".concat(MC_DIR), DOMAIN); // Check for server.properties, to validate minecraft folder..


try {
  _fsExtra.default.statSync(PROPERTIES_FILE);

  _fsExtra.default.statSync(WORLD_DIR);

  _fsExtra.default.statSync(LOGS_DIR);
} catch (err) {
  if (err.code === 'ENOENT') {
    var testedPath = _path.default.basename(err.path);

    _CustomLogger.default.error("No ".concat(testedPath, " found in Minecraft dir!"), DOMAIN);

    process.exit(1);
  } else {
    throw err;
  }
} // Check for items with the world directory


try {
  _fsExtra.default.statSync(STATS_DIR);

  _fsExtra.default.statSync(ADVANCEMENTS_DIR);

  _fsExtra.default.statSync(PLAYERDATA_DIR);
} catch (err) {
  if (err.code === 'ENOENT') {
    var _testedPath = _path.default.basename(err.path);

    _CustomLogger.default.error("No ".concat(_testedPath, " found in Minecraft world dir!"), DOMAIN);

    process.exit(1);
  } else {
    throw err;
  }
}

_CustomLogger.default.info('Minecraft dir passed validation checks.', DOMAIN);

_fsExtra.default.ensureDirSync(OUTPUT_DIR);

_fsExtra.default.ensureDirSync(TEMP_DIR);

_fsExtra.default.ensureDirSync(DATA_DIR);

_fsExtra.default.ensureDirSync(ASSETS_DIR);

_CustomLogger.default.info("Set output dir: ".concat(OUTPUT_DIR), DOMAIN);

var playerdatFiles = _fsExtra.default.readdirSync(PLAYERDATA_DIR),
    players = [];

var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
  for (var _iterator = playerdatFiles[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
    var f = _step.value;

    if (f.indexOf('.dat') > -1) {
      players.push(f.split('.dat')[0]);

      _CustomLogger.default.debug("Discovered player UUID: ".concat(f.split('.dat')[0]), DOMAIN);
    }
  }
} catch (err) {
  _didIteratorError = true;
  _iteratorError = err;
} finally {
  try {
    if (!_iteratorNormalCompletion && _iterator.return != null) {
      _iterator.return();
    }
  } finally {
    if (_didIteratorError) {
      throw _iteratorError;
    }
  }
}

var PLAYERS = players;

_CustomLogger.default.info("Registered ".concat(PLAYERS.length, " players."), DOMAIN);

var _default = {
  MC_DIR: MC_DIR,
  PROPERTIES_FILE: PROPERTIES_FILE,
  LOGS_DIR: LOGS_DIR,
  WORLD_DIR: WORLD_DIR,
  ADVANCEMENTS_DIR: ADVANCEMENTS_DIR,
  STATS_DIR: STATS_DIR,
  PLAYERDATA_DIR: PLAYERDATA_DIR,
  OUTPUT_DIR: OUTPUT_DIR,
  TEMP_DIR: TEMP_DIR,
  DATA_DIR: DATA_DIR,
  ASSETS_DIR: ASSETS_DIR,
  LOGLEVEL: LOGLEVEL,
  PLAYERS: PLAYERS
};
exports.default = _default;