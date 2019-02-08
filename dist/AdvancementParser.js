"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _CustomLogger = _interopRequireDefault(require("./lib/CustomLogger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DOMAIN = 'AdvancementParser';
var workdir = 'unset';
var _default = {
  'setConfig': function setConfig(config) {
    workdir = config.TEMP_DIR;
  }
};
exports.default = _default;