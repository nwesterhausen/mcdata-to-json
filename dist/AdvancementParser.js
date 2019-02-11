"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fsExtra = _interopRequireDefault(require("fs-extra"));

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
    players = [];
var _default = {
  'setConfig': function setConfig(config) {
    workdir = config.TEMP_DIR;
    players = config.PLAYERS;

    _CustomLogger.default.info("Found ".concat(players.length, " player progress files."), DOMAIN);
  }
};
exports.default = _default;