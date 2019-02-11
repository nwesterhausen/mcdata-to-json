"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _path = _interopRequireDefault(require("path"));

var _CustomLogger = _interopRequireDefault(require("./CustomLogger"));

var _Configuration = _interopRequireDefault(require("./Configuration"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Tool to create JSON files with minecraft server data:
 * blocks, items, advancements are all used by scripts.
 */
var StreamZip = require('node-stream-zip');

var DOMAIN = 'DataExtractor';

var advancementsExported = false,
    loottablesExported = false,
    recipesExported = false,
    tagsExported = false,
    structuresExported = false,
    advancementsOutputPath = _path.default.join(_Configuration.default.DATA_DIR, 'minecraft', 'advancements'),
    loottablesOutputPath = _path.default.join(_Configuration.default.DATA_DIR, 'minecraft', 'loot_tables'),
    recipesOutputPath = _path.default.join(_Configuration.default.DATA_DIR, 'minecraft', 'recipes'),
    structuresOutputPath = _path.default.join(_Configuration.default.DATA_DIR, 'minecraft', 'structures'),
    tagsOutputPath = _path.default.join(_Configuration.default.DATA_DIR, 'minecraft', 'tags');

var extractMinecraftDataPromise = function extractMinecraftDataPromise() {
  var serverzipPath = _path.default.join(_Configuration.default.TEMP_DIR, 'server.zip');

  _CustomLogger.default.debug("Trying to extract from ".concat(_Configuration.default.MCJAR_FILE, " by copying to ").concat(serverzipPath), DOMAIN);

  _fsExtra.default.copyFileSync(_Configuration.default.MCJAR_FILE, serverzipPath);

  var zip = new StreamZip({
    'file': serverzipPath
  });
  return new Promise(function (resolve, reject) {
    zip.on('error', function (err) {
      _CustomLogger.default.error("Zip failed to open. ".concat(err), DOMAIN);

      reject();
    }); // zip.on('extract', (entry, file) => {
    //     log.debug(`Extracted ${entry.name} to ${file}`, DOMAIN);
    // });

    zip.on('ready', function () {
      zip.extract('data', _Configuration.default.DATA_DIR, function (err, count) {
        if (err) {
          _CustomLogger.default.error("Error extracting data from zip: ".concat(err));

          zip.close();
          reject(err);
        } else {
          _CustomLogger.default.debug("Extracted ".concat(count, " items from ").concat(serverzipPath), DOMAIN);

          zip.extract('assets', _Configuration.default.ASSETS_DIR, function (err1, count1) {
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
  _CustomLogger.default.info('Extracting data from server.jar (unzipping).', DOMAIN);

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
  structuresExported = false;
  tagsExported = false; // blocklistExported = false;
  // commandlistExported = false;
  // registriesExported = false;

  if (_fsExtra.default.existsSync(_Configuration.default.DATA_DIR)) {
    if (_fsExtra.default.existsSync(_path.default.join(_Configuration.default.DATA_DIR, 'minecraft'))) {
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

  }

  _CustomLogger.default.debug("advancements data is cached: ".concat(advancementsExported), DOMAIN);

  _CustomLogger.default.debug("loottables data is cached: ".concat(loottablesExported), DOMAIN);

  _CustomLogger.default.debug("recipes data is cached: ".concat(recipesExported), DOMAIN);

  _CustomLogger.default.debug("recipes data is cached: ".concat(structuresExported), DOMAIN);

  _CustomLogger.default.debug("tags data is cached: ".concat(tagsExported), DOMAIN); // log.debug(`blocklist data is cached: ${blocklistExported}`, DOMAIN);
  // log.debug(`commandlist data is cached: ${commandlistExported}`, DOMAIN);
  // log.debug(`registries data is cached: ${registriesExported}`, DOMAIN);


  var retval = advancementsExported & loottablesExported & recipesExported & structuresExported & tagsExported;

  _CustomLogger.default.debug("checkForData returning ".concat(retval), DOMAIN);

  return retval;
};

var _default = {
  runDataGenerator: runDataGenerator,
  advancementsExported: advancementsExported,
  loottablesExported: loottablesExported,
  recipesExported: recipesExported,
  tagsExported: tagsExported,
  checkForData: checkForData,
  extractMinecraftDataPromise: extractMinecraftDataPromise
};
exports.default = _default;