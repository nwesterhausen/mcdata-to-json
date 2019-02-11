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
  'workdir': _path.default.join(rundir, 'mcdata_cache'),
  'loglevel': 'info',
  'help': false,
  'use-env': false
},
    knownOpts = {
  'minecraft': _path.default,
  'outputdir': _path.default,
  'workdir': _path.default,
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
    usage = "Usage:\n    --help, -h                      Show this help message and exit.\n    --minecraft=path                The minecraft folder containing server.properties and world.\n    --outputdir=path                The directory to save the generated JSON files into.\n    --workdir=path                  The directory to cache data used by this program\n    --use-env                       Load configuration values from ENV:\n                                        env.MINECRAFT_DIR and env.OUTPUT_DIR\n    --loglevel=<level>              How verbose to log to the console. Also you can use one of\n                                    the helper functions to accomplish this to varying degrees:\n    --silent, -s, --loglevel=error  Log only errors.\n    --quiet, -q, --loglevel=warn    Log only warnings and errors.\n    -v, --loglevel=info [Default]   Log everything except for debug messages.\n    -vvv, -debug, --loglevel=debug  Log everything.",
    parsedOpts = (0, _lodash.defaults)((0, _nopt.default)(knownOpts, shortHands, process.argv, 2), defaultOpts),
    helpMessage = "mcdata-to-json ".concat(_Version.default.version, "\n    A node.js module to turn the data from your minecraft server or world into json.");

var isValidPath = function isValidPath(testpath, description) {
  var fileOrDirName = _path.default.basename(testpath);

  try {
    _fsExtra.default.statSync(testpath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      _CustomLogger.default.warn("No ".concat(fileOrDirName, " found! (").concat(description, ")"), DOMAIN);

      return false;
    } else {
      throw err;
    }
  }

  _CustomLogger.default.debug("\u2714 ".concat(fileOrDirName, " exists."), DOMAIN);

  return true;
};

var LOGLEVEL = loglevels.indexOf(parsedOpts.loglevel);

_CustomLogger.default.setLevel(LOGLEVEL);

_CustomLogger.default.debug("current working dir ".concat(rundir), DOMAIN);

if (parsedOpts.help) {
  console.log(helpMessage); // eslint-disable-line no-console

  console.log(usage); // eslint-disable-line no-console

  process.exit(0);
}

if (parsedOpts['use-env']) {
  _CustomLogger.default.debug('use-env flag set, loading config from environment.', DOMAIN);

  _CustomLogger.default.debug('Process.env vars:', DOMAIN);

  _CustomLogger.default.debug("MINECRAFT_DIR: ".concat(process.env.MINECRAFT_DIR), DOMAIN);

  _CustomLogger.default.debug("OUTPUT_DIR: ".concat(process.env.OUTPUT_DIR), DOMAIN);

  _CustomLogger.default.debug("WORK_DIR: ".concat(process.env.WORK_DIR), DOMAIN);

  if (parsedOpts.minecraft === defaultOpts.minecraft && process.env.MINECRAFT_DIR) {
    parsedOpts.minecraft = process.env.MINECRAFT_DIR;
  }

  if (!parsedOpts.outputdir === defaultOpts.outputdir && process.env.OUTPUT_DIR) {
    parsedOpts.outputdir = process.env.OUTPUT_DIR;
  }

  if (!parsedOpts.workdir === defaultOpts.workdir && process.env.OUTPUT_DIR) {
    parsedOpts.workdir = process.env.WORK_DIR;
  }
} // Check minecraft dir is set..


if (!parsedOpts.minecraft) {
  _CustomLogger.default.error('No minecraft directory set!', DOMAIN);

  process.exit(1);
}

_CustomLogger.default.debug("Checking Minecraft dir: ".concat(parsedOpts.minecraft), DOMAIN); // Check for server.properties, to validate minecraft folder..


if (isValidPath(_path.default.join(parsedOpts.minecraft, 'server.properties'), 'Minecraft server configuration file')) {
  parsedOpts.serverproprties = _path.default.join(parsedOpts.minecraft, 'server.properties');
}

if (isValidPath(_path.default.join(parsedOpts.minecraft, 'minecraft.jar'), 'Minecraft client jar')) {
  parsedOpts.mcjar = _path.default.join(parsedOpts.minecraft, 'minecraft.jar');
} else if (isValidPath(_path.default.join(parsedOpts.minecraft, 'server.jar'), 'Minecraft server jar')) {
  parsedOpts.mcjar = _path.default.join(parsedOpts.minecraft, 'server.jar');
} else {
  _CustomLogger.default.error('Couldn\'t locate a server.jar or minecraft.jar. Please download and put it in the minecraft directory.', DOMAIN);
}

if (isValidPath(_path.default.join(parsedOpts.minecraft, 'world'), 'Minecraft world directory')) {
  parsedOpts.worlddir = _path.default.join(parsedOpts.minecraft, 'world');
}

if (isValidPath(_path.default.join(parsedOpts.minecraft, 'logs'), 'Minecraft log file directory')) {
  parsedOpts.logdir = _path.default.join(parsedOpts.minecraft, 'logs');
}

if (isValidPath(_path.default.join(parsedOpts.minecraft, 'ops.json'), 'List of OPs on the server.')) {
  parsedOpts.opsjson = _path.default.join(parsedOpts.minecraft, 'ops.json');
}

if (isValidPath(_path.default.join(parsedOpts.minecraft, 'usercache.json'), 'Cache connecting UUIDs to player names.')) {
  parsedOpts.usercachejson = _path.default.join(parsedOpts.minecraft, 'usercache.json');
} // Check for valid paths inside world dir


if (isValidPath(_path.default.join(parsedOpts.worlddir, 'level.dat'), 'World data file. Found in world directory.')) {
  parsedOpts.leveldat = _path.default.join(parsedOpts.worlddir, 'level.dat');
}

if (isValidPath(_path.default.join(parsedOpts.worlddir, 'advancements'), 'Player advancement progress. Found in world directory.')) {
  parsedOpts.advancements = _path.default.join(parsedOpts.worlddir, 'advancements');
}

if (isValidPath(_path.default.join(parsedOpts.worlddir, 'data'), 'Additional world data files. Found in world directory.')) {
  parsedOpts.worlddata = _path.default.join(parsedOpts.worlddir, 'data');
}

if (isValidPath(_path.default.join(parsedOpts.worlddir, 'datapacks'), 'Found in world directory.')) {
  parsedOpts.datapacks = _path.default.join(parsedOpts.worlddir, 'datapacks');
}

if (isValidPath(_path.default.join(parsedOpts.worlddir, 'playerdata'), 'Contains player info. Found in world directory.')) {
  parsedOpts.playerdata = _path.default.join(parsedOpts.worlddir, 'playerdata');
}

if (isValidPath(_path.default.join(parsedOpts.worlddir, 'stats'), 'Contains player stats. Found in world directory.')) {
  parsedOpts.stats = _path.default.join(parsedOpts.worlddir, 'stats');
}

if (isValidPath(_path.default.join(parsedOpts.worlddir, 'region'), 'Overworld region files. Found in world directory.')) {
  parsedOpts.overworld = _path.default.join(parsedOpts.worlddir, 'region');
}

if (isValidPath(_path.default.join(parsedOpts.worlddir, 'DIM1'), 'The End region files. Found in world directory.')) {
  parsedOpts.end = _path.default.join(parsedOpts.worlddir, 'DIM1');
}

if (isValidPath(_path.default.join(parsedOpts.worlddir, 'DIM-1'), 'Nether region files. Found in world directory.')) {
  parsedOpts.nether = _path.default.join(parsedOpts.worlddir, 'DIM-1');
}

var MC_DIR = parsedOpts.minecraft,
    PROPERTIES_FILE = parsedOpts.serverproprties,
    USERCACHE_FILE = parsedOpts.usercachejson,
    OPSLIST_FILE = parsedOpts.opsjson,
    MCJAR_FILE = parsedOpts.mcjar,
    LOGS_DIR = parsedOpts.logdir,
    WORLD_DIR = parsedOpts.worlddir,
    WORLDDATA_DIR = parsedOpts.worlddata,
    STATS_DIR = parsedOpts.stats,
    ADVANCEMENTS_DIR = parsedOpts.advancements,
    PLAYERDATA_DIR = parsedOpts.playerdata,
    LEVELDAT_FILE = parsedOpts.leveldat,
    OVERWORLD_DIR = parsedOpts.end,
    NETHER_DIR = parsedOpts.nether,
    END_DIR = parsedOpts.logdir,
    OUTPUT_DIR = parsedOpts.outputdir,
    WORK_DIR = parsedOpts.workdir,
    TEMP_DIR = _path.default.join(WORK_DIR, '.temp'),
    EXTRACTED_DIR = _path.default.join(WORK_DIR, 'extracted'),
    DATA_DIR = _path.default.join(EXTRACTED_DIR, 'data'),
    ASSETS_DIR = _path.default.join(EXTRACTED_DIR, 'assets');

_fsExtra.default.ensureDirSync(OUTPUT_DIR);

_fsExtra.default.ensureDirSync(WORK_DIR);

_fsExtra.default.ensureDirSync(EXTRACTED_DIR);

_fsExtra.default.ensureDirSync(TEMP_DIR);

_fsExtra.default.ensureDirSync(DATA_DIR);

_fsExtra.default.ensureDirSync(ASSETS_DIR);

_CustomLogger.default.debug("Set output dir: ".concat(OUTPUT_DIR), DOMAIN);

var playerdatFiles = _fsExtra.default.readdirSync(PLAYERDATA_DIR),
    players = {};

if (USERCACHE_FILE) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = _fsExtra.default.readJSONSync(USERCACHE_FILE)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var p = _step.value;

      _CustomLogger.default.debug("Discovered cached player: ".concat(p.name, " ").concat(p.uuid), DOMAIN);

      players[p.uuid] = p.name;
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
}

var _iteratorNormalCompletion2 = true;
var _didIteratorError2 = false;
var _iteratorError2 = undefined;

try {
  for (var _iterator2 = playerdatFiles[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
    var f = _step2.value;

    if (f.indexOf('.dat') > -1) {
      var uuid = f.split('.dat')[0];

      if (!players[uuid]) {
        players[uuid] = "no-name".concat(f.substr(f.length - 5, 1));

        _CustomLogger.default.debug("Discovered un-cached player UUID: ".concat(uuid), DOMAIN);
      }
    }
  }
} catch (err) {
  _didIteratorError2 = true;
  _iteratorError2 = err;
} finally {
  try {
    if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
      _iterator2.return();
    }
  } finally {
    if (_didIteratorError2) {
      throw _iteratorError2;
    }
  }
}

var PLAYERS = players;

_CustomLogger.default.info("Registered ".concat(Object.keys(PLAYERS).length, " players."), DOMAIN);

var _default = {
  MC_DIR: MC_DIR,
  PROPERTIES_FILE: PROPERTIES_FILE,
  USERCACHE_FILE: USERCACHE_FILE,
  OPSLIST_FILE: OPSLIST_FILE,
  MCJAR_FILE: MCJAR_FILE,
  LOGS_DIR: LOGS_DIR,
  WORLD_DIR: WORLD_DIR,
  WORLDDATA_DIR: WORLDDATA_DIR,
  STATS_DIR: STATS_DIR,
  ADVANCEMENTS_DIR: ADVANCEMENTS_DIR,
  PLAYERDATA_DIR: PLAYERDATA_DIR,
  LEVELDAT_FILE: LEVELDAT_FILE,
  OVERWORLD_DIR: OVERWORLD_DIR,
  NETHER_DIR: NETHER_DIR,
  END_DIR: END_DIR,
  OUTPUT_DIR: OUTPUT_DIR,
  WORK_DIR: WORK_DIR,
  TEMP_DIR: TEMP_DIR,
  EXTRACTED_DIR: EXTRACTED_DIR,
  DATA_DIR: DATA_DIR,
  ASSETS_DIR: ASSETS_DIR,
  PLAYERS: PLAYERS
};
exports.default = _default;