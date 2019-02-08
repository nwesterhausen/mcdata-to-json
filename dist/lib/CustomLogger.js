"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _safe = require("colors/safe");

/* eslint no-console: "off" */
var loglevel = 1;
var _default = {
  'setLevel': function setLevel(newlevel) {
    loglevel = newlevel;
  },
  'debug': function debug(msg) {
    var domain = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'Undefined';

    if (loglevel >= 3) {
      console.debug(_safe.bgBlue.black(' DEBUG '), (0, _safe.blue)("[".concat(domain, "] ").concat(msg)));
    }
  },
  'info': function info(msg) {
    var domain = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'Undefined';

    if (loglevel >= 2) {
      console.info(_safe.bgGreen.black(' INFO  '), (0, _safe.green)("[".concat(domain, "] ").concat(msg)));
    }
  },
  'warn': function warn(msg) {
    var domain = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'Undefined';

    if (loglevel >= 1) {
      return console.warn(_safe.bgYellow.black(' WARN  '), (0, _safe.yellow)("[".concat(domain, "] ").concat(msg)));
    }
  },
  'error': function error(msg) {
    var domain = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'Undefined';

    if (loglevel >= 0) {
      return console.error(_safe.bgRed.black(' ERROR '), (0, _safe.red)("[".concat(domain, "] ").concat(msg)));
    }
  }
};
exports.default = _default;