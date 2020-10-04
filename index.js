/**
 * You need to set the minecraft folder location in the MC_DIR env variable
 * or use the --minecraft="" parameter when running.
 *
 * By default will output in the current directory, or the OUTPUT_DIR env
 * variable, OR the --outdir="" parameter.
 */
const Log = require("./lib/CustomLogger");
const Config = require("./lib/Configuration");
const LogsParser = require("./lib/helpers/LogsParser");
const ServerDataExtractor = require("./lib/ServerDataTool");
const MojangAPI = require("./lib/MojangApi");
const PlayerData = require("./lib/PlayerData");
const MCAParser = require("./lib/McaParser");
const ProfileHelper = require("./lib/ProfileHelper");
const AdvancementsParser = require("./lib/AdvancementsParser");

const path = require("path");
const fs = require("fs");

const DOMAIN = "Main";

Log.debug(DOMAIN, "Passing configuration to components.");
ServerDataExtractor.setConfig(Config);
Log.info(DOMAIN, `Starting Log Processing ${Config.LOGS_DIR}`);
LogsParser.parseLogFiles(Config);

function createJsonForAllRegionDirs() {
  return new Promise((resolve, reject) => {
    // McaParser.convertRegionDirToJSON(Config.OVERWORLD_DIR);
    // McaParser.convertRegionDirToJSON(Config.NETHER_DIR);
    // McaParser.convertRegionDirToJSON(Config.END_DIR);
    resolve();
  });
}

function combinePlayerData(uuid) {
  let readjsonPromises = [
    fs.promises.readFile(path.join(Config.STATS_DIR, `${uuid}.json`)),
    fs.promises.readFile(path.join(Config.TEMP_ADVANCEMENT_JSON_DIR, `${uuid}.json`)),
    fs.promises.readFile(path.join(Config.TEMP_PLAYERDATA_JSON_DIR, `${uuid}.json`)),
    fs.promises.readFile(path.join(Config.TEMP_PROFILE_JSON_DIR, `${uuid}.json`)),
    fs.promises.readFile(path.join(Config.TEMP_LOG_JSON_DIR, `${uuid}.json`)),
  ];

  Promise.all(readjsonPromises).then((val) => {
    let playerJSON = {
      uuid: uuid,
      name: Config.PLAYERS[uuid],
      stats: JSON.parse(val[0]),
      advancements: JSON.parse(val[1]),
      data: JSON.parse(val[2]),
      profile: JSON.parse(val[3]),
      log: JSON.parse(val[4]),
    };
    delete playerJSON.advancements.DataVersion;
    delete playerJSON.data.DataVersion;
    delete playerJSON.stats.DataVersion;
    fs.promises.writeFile(path.join(Config.OUTPUT_DIR, `${uuid}.json`), JSON.stringify(playerJSON))
      .then((val) => {
        Log.info(`Wrote output JSON for ${uuid}.`, DOMAIN);
        if (val) {
          Log.debug(val, DOMAIN);
        }
      })
      .catch((err) => {
        Log.warn(`Failed to build output for ${uuid}.`, DOMAIN);
        Log.warn(err, DOMAIN);
      });
  });
}

function buildTileEntityList(mcaJsonDir) {

  return new Promise((resolve, reject) => {
  let jsonregionFiles = fs.readdirSync(mcaJsonDir);
    Promise.all(
      jsonregionFiles.map((filename) => {
        // console.log(filename);
        return fs.readFile(path.join(mcaJsonDir, filename));
      })
    )
      .then((chunklistText) => {
        const chunklistJson = JSON.parse(chunklistText);
        let tileEntities = {};
        chunklistJson.map((regionjson) => {
          regionjson.map((chunkjson) => {
            if (chunkjson.hasOwnProperty("TileEntities")) {
              chunkjson.TileEntities.map((te) => {
                if (!tileEntities.hasOwnProperty(te.id)) {
                  tileEntities[te.id] = [];
                }
                tileEntities[te.id].push(te);
              });
            }
          });
        });
        return resolve(tileEntities);
      })
      .catch((err) => {
        return reject(err);
      });
  });
}

///// MAIN ///////

ProfileHelper.updateProfiles()
  .then((val) => {
    // GET PLAYER INFORMATION FROM MOJANG
    return createJsonForAllRegionDirs();
  })
  .then((val) => {
    Log.info("Finished saving chunks to JSON", DOMAIN);
    return val;
  })
  .then((val) => {
    return PlayerData.convertPlayerdatFiles(); // CONVERT PLAYER.DAT FILES
  })
  .then((val) => {
    return AdvancementsParser.parseAndSaveAdvancementFiles();
  })
  .then((val) => {
    return AdvancementsParser.createServerAdvancementProgress();
  })
  .then((val) => {
    fs.writeFileSync(path.join(Config.OUTPUT_DIR, "uuids.json"), JSON.stringify(Config.PLAYERS));
    return Promise.all(
      Object.keys(Config.PLAYERS).map((uuid) => {
        return combinePlayerData(uuid);
      })
    );
  })
  // .then((val) => {
  //   Log.info("Copied player info to output directory", DOMAIN);
  //   return buildTileEntityList(path.join(Config.WORK_DIR, "mcajson", "overworld"));
  // })
  // .then((overworldTEJson) => {
  //   let teWithItems = [],
  //     mobSpawners = [],
  //     signs = [],
  //     lootables = {};
  //   Object.keys(overworldTEJson).map((tilentid) => {
  //     overworldTEJson[tilentid].map((tileent) => {
  //       if (tileent.id === "minecraft:mob_spawner") {
  //         mobSpawners.push({
  //           SpawnData: tileent.SpawnData,
  //           pos: [tileent.x, tileent.y, tileent.z],
  //         });
  //       } else if (tileent.id === "minecraft:sign") {
  //         signs.push({
  //           Text: [
  //             JSON.parse(tileent.Text1.replace(/\\"/, "'")).text,
  //             JSON.parse(tileent.Text2.replace(/\\"/, "'")).text,
  //             JSON.parse(tileent.Text3.replace(/\\"/, "'")).text,
  //             JSON.parse(tileent.Text4.replace(/\\"/, "'")).text,
  //           ],
  //           Color: tileent.Color,
  //           pos: [tileent.x, tileent.y, tileent.z],
  //         });
  //       } else if (tileent.hasOwnProperty("Items")) {
  //         if (tileent.Items.length > 0) {
  //           teWithItems.push({
  //             Items: tileent.Items,
  //             pos: [tileent.x, tileent.y, tileent.z],
  //             id: tileent.id,
  //           });
  //         }
  //       } else if (tileent.hasOwnProperty("LootTable")) {
  //         let loottype = tileent.LootTable.split("/")[1];
  //         if (!lootables.hasOwnProperty(loottype)) {
  //           lootables[loottype] = [];
  //         }
  //         lootables[loottype].push({
  //           type: loottype,
  //           pos: [tileent.x, tileent.y, tileent.z],
  //           id: tileent.id,
  //         });
  //       }
  //     });
  //   });
  //   fs.writeJSONSync(path.join(Config.OUTPUT_DIR, "overworld-spawners.json"), mobSpawners);
  //   fs.writeJSONSync(path.join(Config.OUTPUT_DIR, "overworld-inventories.json"), teWithItems);
  //   fs.writeJSONSync(path.join(Config.OUTPUT_DIR, "overworld-loot.json"), lootables);
  //   fs.writeJSONSync(path.join(Config.OUTPUT_DIR, "overworld-signs.json"), signs);
  //   return fs.writeJSON(path.join(Config.OUTPUT_DIR, "overworld-te.json"), overworldTEJson);
  // })
  // .then((val) => {
  //   Log.info("Wrote all TileEntity details to json.", DOMAIN);
  // })
  .catch((err) => {
    console.log(err);
  });
