"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _path = _interopRequireDefault(require("path"));

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
    dataOutputPath = 'unset',
    assetsOutputPath = 'unset',
    advancementsExported = false,
    loottablesExported = false,
    recipesExported = false,
    tagsExported = false,
    structuresExported = false,
    advancementsOutputPath = 'unset',
    loottablesOutputPath = 'unset',
    recipesOutputPath = 'unset',
    structuresOutputPath = 'unset',
    tagsOutputPath = 'unset',
    busy = false;

var getBusy = function getBusy() {
  return busy;
},
    extractMinecraftDataPromise = function extractMinecraftDataPromise() {
  var serverzipPath = _path.default.join(tempRoot, 'server.zip');

  _CustomLogger.default.debug("Trying to extract from ".concat(serverjarPath, " by copying to ").concat(serverzipPath), DOMAIN);

  _fsExtra.default.copyFileSync(serverjarPath, serverzipPath);

  var zip = new StreamZip({
    'file': serverzipPath
  });
  var datadir = dataOutputPath;

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
          _CustomLogger.default.debug("Extracted ".concat(count, " items from ").concat(serverzipPath), DOMAIN);

          zip.extract('assets', assetsdir, function (err1, count1) {
            if (err) {
              _CustomLogger.default.error("Error extracting lang from zip: ".concat(err1), DOMAIN);

              zip.close();
              reject(err1);
            } else {
              _CustomLogger.default.debug("Extracted ".concat(count1, " items from ").concat(serverzipPath), DOMAIN);

              zip.close();
              resolve();
            }
          });
        }
      });
    });
  });
},
    runDataGenerator = function runDataGenerator() {
  busy = true;

  _CustomLogger.default.info('Extracting data from server.jar (unzipping).', DOMAIN);

  extractMinecraftDataPromise().then(function (val) {
    _CustomLogger.default.debug(val, DOMAIN);

    busy = false;
  }).catch(function (val) {
    _CustomLogger.default.error(val, DOMAIN);

    busy = false;
  });
},
    checkForData = function checkForData() {
  _CustomLogger.default.debug('Resetting data export status.', DOMAIN);

  advancementsExported = false;
  loottablesExported = false;
  recipesExported = false;
  structuresExported = false;
  tagsExported = false; // blocklistExported = false;
  // commandlistExported = false;
  // registriesExported = false;

  if (_fsExtra.default.existsSync(dataOutputPath)) {
    if (_fsExtra.default.existsSync(_path.default.join(dataOutputPath, 'minecraft'))) {
      advancementsExported = _fsExtra.default.existsSync(advancementsOutputPath);
      loottablesExported = _fsExtra.default.existsSync(loottablesOutputPath);
      recipesExported = _fsExtra.default.existsSync(recipesOutputPath);
      structuresExported = _fsExtra.default.existsSync(structuresOutputPath);
      tagsExported = _fsExtra.default.existsSync(tagsOutputPath);
    } // if (fs.existsSync(path.join(tempRoot, 'data', 'reports'))) {
    //     blocklistExported = fs.existsSync(path.join(tempRoot, 'data', 'reports', 'blocks.json'));
    //     commandlistExported = fs.existsSync(path.join(tempRoot, 'data', 'reports', 'commands.json'));
    //     registriesExported = fs.existsSync(path.join(tempRoot, 'data', 'reports', 'registries.json'));
    // }

  } else {
    busy = true;
    extractMinecraftDataPromise().then(function (val) {
      _CustomLogger.default.debug("Data export promise returned ".concat(val), DOMAIN);

      _CustomLogger.default.info('Completed export of minecraft data.', DOMAIN);

      checkForData();
      busy = false;
    }).catch(function (val) {
      _CustomLogger.default.error(val, DOMAIN);

      busy = false;
    });
  }

  _CustomLogger.default.debug("advancements data is cached: ".concat(advancementsExported), DOMAIN);

  _CustomLogger.default.debug("loottables data is cached: ".concat(loottablesExported), DOMAIN);

  _CustomLogger.default.debug("recipes data is cached: ".concat(recipesExported), DOMAIN);

  _CustomLogger.default.debug("recipes data is cached: ".concat(structuresExported), DOMAIN);

  _CustomLogger.default.debug("tags data is cached: ".concat(tagsExported), DOMAIN); // log.debug(`blocklist data is cached: ${blocklistExported}`, DOMAIN);
  // log.debug(`commandlist data is cached: ${commandlistExported}`, DOMAIN);
  // log.debug(`registries data is cached: ${registriesExported}`, DOMAIN);

};

var _default = {
  'setConfig': function setConfig(config) {
    minecraftRoot = config.MC_DIR;
    dataOutputPath = config.DATA_DIR;
    advancementsOutputPath = _path.default.join(config.DATA_DIR, 'advancements');
    loottablesOutputPath = _path.default.join(config.DATA_DIR, 'loot_tables');
    recipesOutputPath = _path.default.join(config.DATA_DIR, 'recipes');
    structuresOutputPath = _path.default.join(config.DATA_DIR, 'structures');
    tagsOutputPath = _path.default.join(config.DATA_DIR, 'tags');
    serverjarPath = _path.default.join(minecraftRoot, 'server.jar');
    checkForData();
  },
  runDataGenerator: runDataGenerator,
  advancementsExported: advancementsExported,
  loottablesExported: loottablesExported,
  recipesExported: recipesExported,
  tagsExported: tagsExported,
  getBusy: getBusy
};
exports.default = _default;