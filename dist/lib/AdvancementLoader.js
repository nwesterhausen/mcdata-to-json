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
 Advancement requirements are in:
 DATAPACKS:: root/world/datapacks/<name>.zip/advancements/[category]/*.json
 VANILLA  :: root/generated/data/minecraft/advancements

 Advancement progress:
 world/advancement/UUID.json
 timestamped on when completed
 **/

/**
 * Advancement JSON Struct (simplified)
 * {
 *   display: {
 *       icon: {
 *          item: minecraft:id
 *       }
 *       title: {
 *           translate: Atlantis
 *       }
 *       description: {
 *          translate: Description string
 *        }
 *       frame: Not needed if default; either challenge | goal
 *   },
 *   criteria: {
 *       criteria1: {},
 *       criteria2: {}
 *   }
 * }
 ***/
var minecraftRoot = 'unset',
    tempRoot = 'unset',
    serverjarPath = 'unset';

var exportMinecraftAdvancementsPromise = function exportMinecraftAdvancementsPromise() {
  return new Promise(function (resolve, reject) {
    _CustomLogger.default.debug('Running minecraft data export from server jar.');

    if (tempRoot === 'unset' || serverjarPath === 'unset') {
      _CustomLogger.default.error('Tried to run data generation without setting serverjar and/or output folder.');

      _CustomLogger.default.error("datadir: ".concat(tempRoot, ", serverjar: ").concat(serverjarPath));

      reject('Failed to set directories.');
    }

    _child_process.default.exec("java -cp ".concat(serverjarPath, " net.minecraft.data.Main --server --output ").concat(tempRoot), function (err, stdout, stderr) {
      // eslint-disable-line 
      if (err) {
        _CustomLogger.default.error('Failed to run command to export minecraft data.');

        _CustomLogger.default.error(err);

        reject(err);
      } else {
        _CustomLogger.default.info('Completed export of minecraft data.');

        resolve(stdout);
      }
    });
  });
},
    exportMinecraftAdvancements = function exportMinecraftAdvancements() {
  _CustomLogger.default.info('Using server.jar to generate advancement data.');

  exportMinecraftAdvancementsPromise().then(function (val) {
    _CustomLogger.default.debug(val);
  });
};

var _default = {
  'setMinecraftRoot': function setMinecraftRoot(mcpath) {
    minecraftRoot = mcpath;
    serverjarPath = _path.default.join(mcpath, 'server.jar');
  },
  'setTempRoot': function setTempRoot(temproot) {
    tempRoot = temproot;
  },
  exportMinecraftAdvancements: exportMinecraftAdvancements
};
exports.default = _default;