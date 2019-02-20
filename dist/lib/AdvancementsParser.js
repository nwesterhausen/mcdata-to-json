"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _CustomLogger = _interopRequireDefault(require("./CustomLogger"));

var _Configuration = _interopRequireDefault(require("../Configuration"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var merge = require('deepmerge');

var DOMAIN = "Advancements Parser";
var CompletedAdvancements = {}; // First a way to create a tree of advancements

function getTreeFromAdvancementJSON(advJsonObj) {
  _CustomLogger.default.debug("Merging ".concat(Object.keys(advJsonObj).length, " advancements"), DOMAIN);

  var advTree = merge.all(Object.keys(advJsonObj).map(function (advpath) {
    var pathstr = advpath.split(':').join('/');
    return objFromPath(pathstr.split('/'), advJsonObj[advpath]);
  }));
  advTree.recipes = merge.all(Object.keys(advTree).map(function (domain) {
    if (advTree[domain].hasOwnProperty('recipes')) {
      var recipejson = JSON.stringify(advTree[domain].recipes);
      delete advTree[domain].recipes;
      return JSON.parse(recipejson);
    }

    return {};
  }));
  return advTree;
} // Turn the path array into an object


function objFromPath(pathArr, endValue) {
  if (pathArr.length === 1) {
    return _defineProperty({}, pathArr[0], [endValue]);
  } else {
    return _defineProperty({}, pathArr[0], objFromPath(pathArr.slice(1), endValue));
  }
} // Helper function to convert and output 'parsed' advancements


function parseAndSaveAdvancementFile(filename) {
  _CustomLogger.default.debug("Returning a promise for converting ".concat(filename), DOMAIN);

  return new Promise(function (resolve, reject) {
    _fsExtra.default.readJSON(_path.default.join(_Configuration.default.ADVANCEMENTS_DIR, filename)).then(function (advjson) {
      return _fsExtra.default.writeJSON(_path.default.join(_Configuration.default.TEMP_ADVANCEMENT_JSON_DIR, filename), getTreeFromAdvancementJSON(advjson), {
        'spaces': 2
      });
    }).then(function (val) {
      resolve(val);
    }).catch(function (err) {
      reject(err);
    });
  });
}

function parseAndSaveAdvancementFiles() {
  var advjsonPromises = [];

  _fsExtra.default.readdirSync(_Configuration.default.ADVANCEMENTS_DIR).map(function (filename) {
    if (_path.default.extname(filename) === '.json') {
      advjsonPromises.push(parseAndSaveAdvancementFile(filename));
    }
  });

  return new Promise(function (resolve, reject) {
    Promise.all(advjsonPromises).then(function (val) {
      return resolve(val);
    }).catch(function (err) {
      return reject(err);
    });
  });
}

function createServerAdvancementProgress() {
  var serverAdvancementPromises = _fsExtra.default.readdirSync(_Configuration.default.ADVANCEMENTS_DIR).map(function (fn) {
    return new Promise(function (resolve, reject) {
      _fsExtra.default.readJSON(_path.default.join(_Configuration.default.ADVANCEMENTS_DIR, fn)).then(function (rawjson) {
        var pname = fn.replace(/.json/, '');
        var completedList = Object.keys(rawjson).map(function (k) {
          if (rawjson[k].done) {
            var completed = [pname];
            return _defineProperty({}, k, completed);
          } else {
            return _defineProperty({}, k, []);
          }
        });
        return resolve(completedList);
      }).catch(function (err) {
        return reject(err);
      });
    });
  });

  return new Promise(function (resolve, reject) {
    Promise.all(serverAdvancementPromises).then(function (val) {
      var mergedJSON = merge.all(val.flat());
      var treeMerged = getTreeFromAdvancementJSON(mergedJSON);
      return _fsExtra.default.writeJSON(_path.default.join(_Configuration.default.OUTPUT_DIR, 'server-advancements.json'), treeMerged, {
        'spaces': 2
      });
    }).then(function (val) {
      resolve(val);
    }).catch(function (err) {
      reject(err);
    });
  });
}

var _default = {
  getTreeFromAdvancementJSON: getTreeFromAdvancementJSON,
  parseAndSaveAdvancementFile: parseAndSaveAdvancementFile,
  parseAndSaveAdvancementFiles: parseAndSaveAdvancementFiles,
  createServerAdvancementProgress: createServerAdvancementProgress
};
exports.default = _default;