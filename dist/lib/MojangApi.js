"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Configuration = _interopRequireDefault(require("./Configuration"));

var _CustomLogger = _interopRequireDefault(require("./CustomLogger"));

var _path = _interopRequireDefault(require("path"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _axios = _interopRequireDefault(require("axios"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var BASE_API = 'https://sessionserver.mojang.com/session/minecraft/profile/',
    PLAYER_PROFILE_DIR = _path.default.join(_Configuration.default.TEMP_DIR, 'profiles'),
    DOMAIN = 'MojangAPI Runner',
    RECENT_THRESHOLD_MS = 1000 * 60 * 60 * 4; // 4 hours


_fsExtra.default.ensureDirSync(PLAYER_PROFILE_DIR);

var undashUUID = function undashUUID(uuid) {
  return uuid.replace(/-/g, '');
},
    redashUUID = function redashUUID(uriUuid) {
  var POS_0 = 8,
      POS_1 = 12,
      POS_2 = 16,
      POS_3 = 20;
  return [uriUuid.slice(0, POS_0), uriUuid.slice(POS_0, POS_1), uriUuid.slice(POS_1, POS_2), uriUuid.slice(POS_2, POS_3), uriUuid.slice(POS_3)].join('-');
},
    writeJSON = function writeJSON(uuid, rawjson) {
  var parsedJSON = {
    'id': rawjson.id,
    'name': rawjson.name,
    'properties': {}
  };

  try {
    for (var i = 0; i < rawjson.properties.length; i++) {
      var propertyName = rawjson.properties[i].name;
      var propertyValue = JSON.parse(Buffer.from(rawjson.properties[i].value, 'base64').toString());
      parsedJSON.properties[propertyName] = propertyValue;

      _CustomLogger.default.debug("Successfully decoded ".concat(propertyName, " property for ").concat(parsedJSON.name), DOMAIN);
    }
  } catch (err) {
    _CustomLogger.default.error('Unable to properly decode base64 response.', DOMAIN);

    console.log(rawjson); // eslint-disable-line no-console
  }

  var PROPER_JSON = parsedJSON,
      FILEPATH = _path.default.join(PLAYER_PROFILE_DIR, "".concat(uuid, ".json"));

  _fsExtra.default.writeJSON(FILEPATH, PROPER_JSON).then(function (res) {
    _CustomLogger.default.info("Saved Mojang Profile for ".concat(PROPER_JSON.name, " to ").concat(FILEPATH, "."), DOMAIN);
  }).catch(function (err) {
    _CustomLogger.default.error("Failed saving ".concat(FILEPATH, "!"), DOMAIN);

    throw err;
  });
},
    updateProfileWrapper = function updateProfileWrapper(uuid) {
  var UUID_TO_CHECK = uuid,
      CLEANED_UUID = uuid.replace(/-/g, ''),
      GETPROFILE_URL = "".concat(BASE_API).concat(CLEANED_UUID);

  _axios.default.get(GETPROFILE_URL).then(function (res) {
    _CustomLogger.default.debug("".concat(res.status, ": ").concat(res.statusText, " [").concat(UUID_TO_CHECK, "]"), DOMAIN);

    if (res.data) {
      writeJSON(UUID_TO_CHECK, res.data);
    } else {
      _CustomLogger.default.warn("Unable to update Mojang Profile for ".concat(UUID_TO_CHECK, " (").concat(res.status, ")"));
    }
  }).catch(function (err) {
    // unable to update
    _CustomLogger.default.error("".concat(err, " :").concat(UUID_TO_CHECK), DOMAIN);
  });
},
    updateProfiles = function updateProfiles() {
  var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

  for (var i in Object.keys(_Configuration.default.PLAYERS)) {
    var uuid = Object.keys(_Configuration.default.PLAYERS)[i],
        rightnow = new Date();

    try {
      var jsonFileStat = _fsExtra.default.statSync(_path.default.join(PLAYER_PROFILE_DIR, "".concat(uuid, ".json")));

      if (rightnow - jsonFileStat.mtime < RECENT_THRESHOLD_MS && !force) {
        _CustomLogger.default.info("Mojang Profile for ".concat(_Configuration.default.PLAYERS[uuid], " is younger than 4 hours, not updating."), DOMAIN);

        _CustomLogger.default.debug("Age difference for ".concat(_Configuration.default.PLAYERS[uuid], ": ").concat(rightnow - jsonFileStat.mtime, " (4hrs: ").concat(RECENT_THRESHOLD_MS, ")"), DOMAIN);
      } else {
        if (!force) {
          _CustomLogger.default.info("Mojang Profile for ".concat(_Configuration.default.PLAYERS[uuid], " is older than 4 hours, requesting update."), DOMAIN);

          _CustomLogger.default.debug("Age difference for ".concat(_Configuration.default.PLAYERS[uuid], ": ").concat(rightnow - jsonFileStat.mtime, " (4hrs: ").concat(RECENT_THRESHOLD_MS, ")"), DOMAIN);
        } else {
          _CustomLogger.default.info("Forcing update of Mojang Profile for ".concat(_Configuration.default.PLAYERS[uuid], "."), DOMAIN);
        }

        updateProfileWrapper(uuid);
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        _CustomLogger.default.info("Mojang Profile for ".concat(uuid, " doesn't exist, fetching profile."), DOMAIN);

        updateProfileWrapper(uuid);
      } else {
        throw err;
      }
    }
  }
},
    lazyProfileUpdate = function lazyProfileUpdate() {
  updateProfiles(false);
},
    forceProfileUpdate = function forceProfileUpdate() {
  updateProfiles(true);
};

var _default = {
  lazyProfileUpdate: lazyProfileUpdate,
  forceProfileUpdate: forceProfileUpdate,
  undashUUID: undashUUID,
  redashUUID: redashUUID
};
exports.default = _default;