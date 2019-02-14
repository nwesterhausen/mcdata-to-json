"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _axios = _interopRequireDefault(require("axios"));

var _CustomLogger = _interopRequireDefault(require("./CustomLogger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var BASE_API_URL = 'https://sessionserver.mojang.com/session/minecraft/profile',
    DOMAIN = 'MojangAPI Runner';

var uriEncodeUUID = function uriEncodeUUID(uuid) {
  return uuid.replace(/-/g, '');
},
    uriDecodeUUID = function uriDecodeUUID(uuid) {
  var P1 = 8,
      P2 = 12,
      P3 = 16,
      P4 = 20;
  return [uuid.slice(0, P1), uuid.slice(P1, P2), uuid.slice(P2, P3), uuid.slice(P3, P4), uuid.slice(P4)].join('-');
},
    getProfileForUUID = function getProfileForUUID(uuid) {
  var API_ENDPOINT = "".concat(BASE_API_URL, "/").concat(uuid.replace(/-/g, ''));

  _CustomLogger.default.debug("Providing Axios promise for ".concat(API_ENDPOINT), DOMAIN);

  return _axios.default.get(API_ENDPOINT);
},
    jsonFromProfileResp = function jsonFromProfileResp(resp) {
  var fulljson = {
    'id': resp.id,
    'name': resp.name,
    'properties': {}
  };

  if (resp.properties) {
    resp.properties.map(function (property) {
      fulljson[property['name']] = JSON.parse(Buffer.from(property['value'], 'base64'));
    });
  }

  return fulljson;
};

var _default = {
  uriDecodeUUID: uriDecodeUUID,
  uriEncodeUUID: uriEncodeUUID,
  getProfileForUUID: getProfileForUUID,
  jsonFromProfileResp: jsonFromProfileResp
};
exports.default = _default;