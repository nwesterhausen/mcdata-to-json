"use strict";

var _Configuration = _interopRequireDefault(require("./Configuration"));

var _CustomLogger = _interopRequireDefault(require("./lib/CustomLogger"));

var _MojangApi = _interopRequireDefault(require("./lib/MojangApi"));

var _PlayerData = _interopRequireDefault(require("./lib/PlayerData"));

var _Parser = _interopRequireDefault(require("./lib/log/Parser"));

var _McaParser = _interopRequireDefault(require("./lib/McaParser"));

var _ProfileHelper = _interopRequireDefault(require("./lib/ProfileHelper"));

var _AdvancementsParser = _interopRequireDefault(require("./lib/AdvancementsParser"));

var _path = _interopRequireDefault(require("path"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DOMAIN = 'Main';

function performLogOperations() {
  return new Promise(function (resolve, reject) {
    Promise.all(_fsExtra.default.readdirSync(_Configuration.default.LOGS_DIR).map(function (logfile) {
      return _Parser.default.mclogToJson(logfile);
    })).then(function (val) {
      _CustomLogger.default.info("Wrote ".concat(val.length, " log files to JSON."), DOMAIN);

      _Parser.default.sortRawlogJSON();

      _Parser.default.buildCombinedLogfiles();

      _Parser.default.buildPlayerLogfiles();

      return resolve('Logparsing Completed');
    }).catch(function (err) {
      _CustomLogger.default.warn(err, DOMAIN);

      return reject(err);
    });
  });
}

function createJsonForAllRegionDirs() {
  return new Promise(function (resolve, reject) {
    _McaParser.default.convertRegionDirToJSON(_Configuration.default.OVERWORLD_DIR);

    _McaParser.default.convertRegionDirToJSON(_Configuration.default.NETHER_DIR);

    _McaParser.default.convertRegionDirToJSON(_Configuration.default.END_DIR);

    resolve();
  });
}

function combinePlayerData(uuid) {
  var readjsonPromises = [_fsExtra.default.readJSON(_path.default.join(_Configuration.default.STATS_DIR, "".concat(uuid, ".json"))), _fsExtra.default.readJSON(_path.default.join(_Configuration.default.TEMP_ADVANCEMENT_JSON_DIR, "".concat(uuid, ".json"))), _fsExtra.default.readJSON(_path.default.join(_Configuration.default.TEMP_PLAYERDATA_JSON_DIR, "".concat(uuid, ".json"))), _fsExtra.default.readJSON(_path.default.join(_Configuration.default.TEMP_PROFILE_JSON_DIR, "".concat(uuid, ".json"))), _fsExtra.default.readJSON(_path.default.join(_Configuration.default.TEMP_LOG_JSON_DIR, "".concat(uuid, ".json")))];
  Promise.all(readjsonPromises).then(function (val) {
    _fsExtra.default.writeJSON(_path.default.join(_Configuration.default.OUTPUT_DIR, "".concat(uuid, ".json")), {
      'uuid': uuid,
      'name': _Configuration.default.PLAYERS[uuid],
      'stats': val[0],
      'advancements': val[1],
      'data': val[2],
      'profile': val[3],
      'log': val[4]
    }).then(function (val) {
      _CustomLogger.default.info("Wrote output JSON for ".concat(uuid, "."), DOMAIN);

      if (val) {
        _CustomLogger.default.debug(val, DOMAIN);
      }
    }).catch(function (err) {
      _CustomLogger.default.warn("Failed to build output for ".concat(uuid, "."), DOMAIN);

      _CustomLogger.default.warn(err, DOMAIN);
    });
  });
}

function buildTileEntityList(mcaJsonDir) {
  var jsonregionFiles = _fsExtra.default.readdirSync(mcaJsonDir);

  return new Promise(function (resolve, reject) {
    Promise.all(jsonregionFiles.map(function (filename) {
      // console.log(filename);
      return _fsExtra.default.readJSON(_path.default.join(mcaJsonDir, filename));
    })).then(function (chunklistJson) {
      var tileEntities = {};
      chunklistJson.map(function (regionjson) {
        regionjson.map(function (chunkjson) {
          if (chunkjson.hasOwnProperty('TileEntities')) {
            chunkjson.TileEntities.map(function (te) {
              if (!tileEntities.hasOwnProperty(te.id)) {
                tileEntities[te.id] = [];
              }

              tileEntities[te.id].push(te);
            });
          }
        });
      });
      return resolve(tileEntities);
    }).catch(function (err) {
      return reject(err);
    });
  });
} ///// MAIN ///////


_ProfileHelper.default.updateProfiles().then(function (val) {
  // GET PLAYER INFORMATION FROM MOJANG
  return createJsonForAllRegionDirs();
}).then(function (val) {
  _CustomLogger.default.info('Finished saving chunks to JSON', DOMAIN);

  return val;
}).then(function (val) {
  return _PlayerData.default.convertPlayerdatFiles(); // CONVERT PLAYER.DAT FILES
}).then(function (val) {
  return _AdvancementsParser.default.parseAndSaveAdvancementFiles();
}).then(function (val) {
  return _AdvancementsParser.default.createServerAdvancementProgress();
}).then(function (val) {
  return performLogOperations(); // CONVERT LOG FILES
}).then(function (logopResp) {
  _CustomLogger.default.info('All log operations completed', DOMAIN);

  _fsExtra.default.writeJsonSync(_path.default.join(_Configuration.default.OUTPUT_DIR, 'uuids.json'), _Configuration.default.PLAYERS);

  return Promise.all(Object.keys(_Configuration.default.PLAYERS).map(function (uuid) {
    return combinePlayerData(uuid);
  }));
}).then(function (val) {
  _CustomLogger.default.info('Copied player info to output directory', DOMAIN);

  return buildTileEntityList(_path.default.join(_Configuration.default.WORK_DIR, 'mcajson', 'overworld'));
}).then(function (overworldTEJson) {
  var teWithItems = [],
      mobSpawners = [],
      signs = [],
      lootables = {};
  Object.keys(overworldTEJson).map(function (tilentid) {
    overworldTEJson[tilentid].map(function (tileent) {
      if (tileent.id === 'minecraft:mob_spawner') {
        mobSpawners.push({
          SpawnData: tileent.SpawnData,
          pos: [tileent.x, tileent.y, tileent.z]
        });
      } else if (tileent.id === 'minecraft:sign') {
        signs.push({
          Text: [JSON.parse(tileent.Text1.replace(/\\"/, "'")).text, JSON.parse(tileent.Text2.replace(/\\"/, "'")).text, JSON.parse(tileent.Text3.replace(/\\"/, "'")).text, JSON.parse(tileent.Text4.replace(/\\"/, "'")).text],
          Color: tileent.Color,
          pos: [tileent.x, tileent.y, tileent.z]
        });
      } else if (tileent.hasOwnProperty('Items')) {
        if (tileent.Items.length > 0) {
          teWithItems.push({
            Items: tileent.Items,
            pos: [tileent.x, tileent.y, tileent.z],
            id: tileent.id
          });
        }
      } else if (tileent.hasOwnProperty('LootTable')) {
        var loottype = tileent.LootTable.split('/')[1];

        if (!lootables.hasOwnProperty(loottype)) {
          lootables[loottype] = [];
        }

        lootables[loottype].push({
          type: loottype,
          pos: [tileent.x, tileent.y, tileent.z],
          id: tileent.id
        });
      }
    });
  });

  _fsExtra.default.writeJSONSync(_path.default.join(_Configuration.default.OUTPUT_DIR, 'overworld-spawners.json'), mobSpawners);

  _fsExtra.default.writeJSONSync(_path.default.join(_Configuration.default.OUTPUT_DIR, 'overworld-inventories.json'), teWithItems);

  _fsExtra.default.writeJSONSync(_path.default.join(_Configuration.default.OUTPUT_DIR, 'overworld-loot.json'), lootables);

  _fsExtra.default.writeJSONSync(_path.default.join(_Configuration.default.OUTPUT_DIR, 'overworld-signs.json'), signs);

  return _fsExtra.default.writeJSON(_path.default.join(_Configuration.default.OUTPUT_DIR, 'overworld-te.json'), overworldTEJson);
}).then(function (val) {
  _CustomLogger.default.info('Wrote all TileEntity details to json.', DOMAIN);
}).catch(function (err) {
  console.log(err);
});