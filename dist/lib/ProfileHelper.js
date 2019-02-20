"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Configuration = _interopRequireDefault(require("../Configuration"));

var _CustomLogger = _interopRequireDefault(require("./CustomLogger"));

var _MojangApi = _interopRequireDefault(require("./MojangApi"));

var _path = _interopRequireDefault(require("path"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DOMAIN = 'Profile Collector';
var _default = {
  updateProfiles: function updateProfiles() {
    var honorCache = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    var uuid_list = Object.keys(_Configuration.default.PLAYERS);
    return Promise.all(uuid_list.map(function (uuid) {
      var cachedPlayerProfile = _path.default.join(_Configuration.default.TEMP_PROFILE_JSON_DIR, "".concat(uuid, ".json"));

      var shouldQueryProfile = false;

      if (_fsExtra.default.existsSync(cachedPlayerProfile)) {
        shouldQueryProfile = Date.now() - _fsExtra.default.statSync(cachedPlayerProfile).mtime > _Configuration.default.ACCEPTABLE_PROFILE_AGE || !honorCache;
      }

      if (shouldQueryProfile) {
        _CustomLogger.default.debug("Updating Mojang profile on disk for ".concat(uuid), DOMAIN);

        return new Promise(function (resolve, reject) {
          _MojangApi.default.getProfileForUUID(uuid).then(function (profileResp) {
            _CustomLogger.default.debug("Profile for ".concat(uuid, " ").concat(profileResp.status, " ").concat(profileResp.statusText), DOMAIN);

            if (profileResp.data) {
              var cleanedProfileJSON = _MojangApi.default.jsonFromProfileResp(profileResp.data);

              return _fsExtra.default.writeJSON(cachedPlayerProfile, cleanedProfileJSON, {
                'spaces': 2
              });
            }
          }).then(function (res) {
            _CustomLogger.default.info("Cached new profile data for ".concat(uuid), DOMAIN);
          }).catch(function (err) {
            if (err.message.indexOf('code 429')) {
              _CustomLogger.default.warn('Too many requests to Mojang API.', DOMAIN);
            } else _CustomLogger.default.warn(err, DOMAIN);
          });
        });
      } else {
        _CustomLogger.default.info("No need to update Mojang profile for ".concat(_Configuration.default.PLAYERS[uuid], ", cache is younger than 4 hours"), DOMAIN);
      }
    }));
  }
};
exports.default = _default;