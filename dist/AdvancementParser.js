"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = _interopRequireDefault(require("path"));

var _CustomLogger = _interopRequireDefault(require("./lib/CustomLogger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 Advancement requirements are in:
 DATAPACKS:: root/world/datapacks/<name>/advancements/[category]/*.json
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
var DOMAIN = 'AdvancementParser';
var workdir = 'unset',
    playerProgressDir = 'unset',
    advancementDefinitions = {};
var _default = {
  'setConfig': function setConfig(config) {
    workdir = config.TEMP_DIR;
    playerProgressDir = _path.default.join(config.MC_DIR, 'world', 'advancements');
  }
};
exports.default = _default;