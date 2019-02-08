"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _path = _interopRequireDefault(require("path"));

var _child_process = _interopRequireDefault(require("child_process"));

var _CustomLogger = _interopRequireDefault(require("./CustomLogger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Tool to create JSON files with minecraft server data:
 * blocks, items, advancements are all used by scripts.
 */
var DOMAIN = 'DataExtrator';
var minecraftRoot = 'unset',
    tempRoot = 'unset',
    serverjarPath = 'unset',
    advancementsExported = false,
    loottablesExported = false,
    recipesExported = false,
    tagsExported = false,
    blocklistExported = false,
    commandlistExported = false,
    registriesExported = false;

var checkForData = function checkForData() {
  _CustomLogger.default.debug(DOMAIN, 'Resetting data export status.');

  advancementsExported = false;
  loottablesExported = false;
  recipesExported = false;
  tagsExported = false;
  blocklistExported = false;
  commandlistExported = false;
  registriesExported = false;

  if (_fsExtra.default.existsSync(_path.default.join(tempRoot, 'data'))) {
    if (_fsExtra.default.existsSync(_path.default.join(tempRoot, 'data', 'minecraft'))) {
      advancementsExported = _fsExtra.default.existsSync(_path.default.join(tempRoot, 'data', 'minecraft', 'advancements'));
      loottablesExported = _fsExtra.default.existsSync(_path.default.join(tempRoot, 'data', 'minecraft', 'loot_tables'));
      recipesExported = _fsExtra.default.existsSync(_path.default.join(tempRoot, 'data', 'minecraft', 'recipes'));
      tagsExported = _fsExtra.default.existsSync(_path.default.join(tempRoot, 'data', 'minecraft', 'tags'));
    }

    if (_fsExtra.default.existsSync(_path.default.join(tempRoot, 'data', 'reports'))) {
      blocklistExported = _fsExtra.default.existsSync(_path.default.join(tempRoot, 'data', 'reports', 'blocks.json'));
      blocklistExported = _fsExtra.default.existsSync(_path.default.join(tempRoot, 'data', 'reports', 'commands.json'));
      blocklistExported = _fsExtra.default.existsSync(_path.default.join(tempRoot, 'data', 'reports', 'registries.json'));
    }
  }

  _CustomLogger.default.debug(DOMAIN, "advancements data is cached: ".concat(advancementsExported));

  _CustomLogger.default.debug(DOMAIN, "loottables data is cached: ".concat(loottablesExported));

  _CustomLogger.default.debug(DOMAIN, "recipes data is cached: ".concat(recipesExported));

  _CustomLogger.default.debug(DOMAIN, "tags data is cached: ".concat(tagsExported));

  _CustomLogger.default.debug(DOMAIN, "blocklist data is cached: ".concat(blocklistExported));

  _CustomLogger.default.debug(DOMAIN, "commandlist data is cached: ".concat(commandlistExported));

  _CustomLogger.default.debug(DOMAIN, "registries data is cached: ".concat(registriesExported));
},
    exportMinecraftDataPromise = function exportMinecraftDataPromise() {
  return new Promise(function (resolve, reject) {
    _CustomLogger.default.debug(DOMAIN, 'Running minecraft data export from server jar.');

    if (tempRoot === 'unset' || serverjarPath === 'unset') {
      _CustomLogger.default.error(DOMAIN, 'Tried to run data generation without setting serverjar and/or output folder.');

      _CustomLogger.default.error(DOMAIN, "datadir: ".concat(tempRoot, ", serverjar: ").concat(serverjarPath));

      reject('Failed to set directories.');
    }

    _child_process.default.exec("java -cp ".concat(serverjarPath, " net.minecraft.data.Main --all --output ").concat(tempRoot), function (err, stdout, stderr) {
      // eslint-disable-line 
      if (err) {
        _CustomLogger.default.error(DOMAIN, 'Failed to run command to export minecraft data.');

        _CustomLogger.default.error(DOMAIN, err);

        reject(err);
      } else {
        _CustomLogger.default.info(DOMAIN, 'Completed export of minecraft data.');

        resolve(stdout);
      }
    });
  });
},
    ensureMinecraftAdvancements = function ensureMinecraftAdvancements() {
  _CustomLogger.default.debug(DOMAIN, 'Checking for data already in output folder.');

  if (!advancementsExported) {
    _CustomLogger.default.info(DOMAIN, 'Using server.jar to generate advancement data.');

    exportMinecraftDataPromise().then(function (val) {
      _CustomLogger.default.debug(DOMAIN, val);
    });
  } else {
    _CustomLogger.default.info(DOMAIN, "Using cached minecraft advancements in ".concat(_path.default.join(tempRoot, 'data', 'minecraft', 'advancements')));
  }
};

var _default = {
  'setMinecraftRoot': function setMinecraftRoot(mcpath) {
    minecraftRoot = mcpath;
    serverjarPath = _path.default.join(mcpath, 'server.jar');
  },
  'setTempRoot': function setTempRoot(temproot) {
    tempRoot = temproot;
    checkForData();
  },
  exportMinecraftAdvancements: ensureMinecraftAdvancements
};
exports.default = _default;