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
var StreamZip = require('node-stream-zip');

var DOMAIN = 'DataExtractor';
var minecraftRoot = 'unset',
    tempRoot = 'unset',
    serverjarPath = 'unset',
    advancementsExported = false,
    loottablesExported = false,
    recipesExported = false,
    tagsExported = false,
    blocklistExported = false,
    commandlistExported = false,
    registriesExported = false,
    busy = false;

var setBusy = function setBusy(bool) {
  _CustomLogger.default.debug("Setting busy to ".concat(bool), DOMAIN);

  busy = bool;
},
    getBusy = function getBusy() {
  return busy;
},
    extractMinecraftDataPromise = function extractMinecraftDataPromise() {
  var serverzipPath = _path.default.join(tempRoot, 'server.zip');

  _CustomLogger.default.debug("Trying to extract from ".concat(serverjarPath, " by copying to ").concat(serverzipPath), DOMAIN);

  _fsExtra.default.copyFileSync(serverjarPath, serverzipPath);

  var zip = new StreamZip({
    'file': serverzipPath
  });

  var datadir = _path.default.join(tempRoot, 'data');

  var assetsdir = _path.default.join(tempRoot, 'assets');

  _fsExtra.default.ensureDirSync(datadir);

  _fsExtra.default.ensureDirSync(assetsdir);

  return new Promise(function (resolve, reject) {
    zip.on('error', function (err) {
      _CustomLogger.default.error("Zip failed to open. ".concat(err), DOMAIN);

      reject();
    });
    zip.on('extract', function (entry, file) {
      _CustomLogger.default.debug("Extracted ".concat(entry.name, " to ").concat(file), DOMAIN);
    });
    zip.on('ready', function () {
      zip.extract('data', datadir, function (err, count) {
        if (err) {
          _CustomLogger.default.error("Error extracting data from zip: ".concat(err));

          zip.close();
          reject(err);
        } else {
          _CustomLogger.default.debug("Extracted ".concat(count, " items from ").concat(serverzipPath));

          zip.extract('assets', assetsdir, function (err1, count1) {
            if (err) {
              _CustomLogger.default.error("Error extracting lang from zip: ".concat(err1));

              zip.close();
              reject(err1);
            } else {
              _CustomLogger.default.debug("Extracted ".concat(count1, " items from ").concat(serverzipPath));

              zip.close();
              resolve();
            }
          });
        }
      });
    });
  });
},
    exportMinecraftDataPromise = function exportMinecraftDataPromise() {
  var tempdirectory = tempRoot,
      serverjarfile = serverjarPath,
      dataextractorBusy = setBusy;
  return new Promise(function (resolve, reject) {
    dataextractorBusy(true);

    _CustomLogger.default.info('Running minecraft data export from server jar. This may take a couple minutes!', DOMAIN);

    if (tempdirectory === 'unset' || serverjarfile === 'unset') {
      _CustomLogger.default.error('Tried to run data generation without setting serverjar and/or output folder.', DOMAIN);

      _CustomLogger.default.error("datadir: ".concat(tempRoot, ", serverjar: ").concat(serverjarPath), DOMAIN);

      reject('Failed to set directories.');
    }

    _child_process.default.exec("java -cp ".concat(serverjarPath, " net.minecraft.data.Main --all --output ").concat(tempRoot), function (err, stdout, stderr) {
      // eslint-disable-line
      dataextractorBusy(false);

      if (err) {
        _CustomLogger.default.error('Failed to run command to export minecraft data.', DOMAIN);

        _CustomLogger.default.error(err, DOMAIN);

        reject(err);
      } else {
        _CustomLogger.default.info('Completed export of minecraft data.', DOMAIN);

        resolve(stdout);
      }
    });
  });
},
    runDataGenerator = function runDataGenerator() {
  _CustomLogger.default.info('Using server.jar to generate advancement data.', DOMAIN);

  extractMinecraftDataPromise().then(function (val) {
    _CustomLogger.default.debug(val, DOMAIN);
  }).catch(function (val) {
    _CustomLogger.default.error(val, DOMAIN);
  });
},
    checkForData = function checkForData() {
  _CustomLogger.default.debug('Resetting data export status.', DOMAIN);

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
  } else {
    extractMinecraftDataPromise().then(function (val) {
      _CustomLogger.default.debug("Data export promise returned ".concat(val), DOMAIN);

      _CustomLogger.default.info('Completed export of minecraft data.', DOMAIN);

      checkForData();
    }).catch(function (val) {
      _CustomLogger.default.error(val, DOMAIN);
    });
  }

  _CustomLogger.default.debug("advancements data is cached: ".concat(advancementsExported), DOMAIN);

  _CustomLogger.default.debug("loottables data is cached: ".concat(loottablesExported), DOMAIN);

  _CustomLogger.default.debug("recipes data is cached: ".concat(recipesExported), DOMAIN);

  _CustomLogger.default.debug("tags data is cached: ".concat(tagsExported), DOMAIN);

  _CustomLogger.default.debug("blocklist data is cached: ".concat(blocklistExported), DOMAIN);

  _CustomLogger.default.debug("commandlist data is cached: ".concat(commandlistExported), DOMAIN);

  _CustomLogger.default.debug("registries data is cached: ".concat(registriesExported), DOMAIN);
};

var _default = {
  'setConfig': function setConfig(config) {
    minecraftRoot = config.MC_DIR;
    tempRoot = config.TEMP_DIR;
    serverjarPath = _path.default.join(minecraftRoot, 'server.jar');
    checkForData();
  },
  runDataGenerator: runDataGenerator,
  advancementsExported: advancementsExported,
  loottablesExported: loottablesExported,
  recipesExported: recipesExported,
  tagsExported: tagsExported,
  blocklistExported: blocklistExported,
  commandlistExported: commandlistExported,
  registriesExported: registriesExported,
  getBusy: getBusy
};
exports.default = _default;