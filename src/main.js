import Config from './Configuration';
import Log from './lib/CustomLogger';
import MojangAPI from './lib/MojangApi';
import PlayerData from './lib/PlayerData';
import LogParser from './lib/log/Parser';
import MCAParser from './lib/McaParser';
import ProfileHelper from './lib/ProfileHelper';
import AdvancementsParser from './lib/AdvancementsParser';

import path from 'path';
import fs from 'fs-extra';
import McaParser from './lib/McaParser';

const DOMAIN = 'Main';

function performLogOperations() {
    return new Promise((resolve, reject) => {
        Promise.all(fs.readdirSync(Config.LOGS_DIR).map((logfile) => {
                return LogParser.mclogToJson(logfile);
            }))
            .then((val) => {
                Log.info(`Wrote ${val.length} log files to JSON.`, DOMAIN);
                LogParser.sortRawlogJSON();
                LogParser.buildCombinedLogfiles();
                LogParser.buildPlayerLogfiles();
                return resolve('Logparsing Completed');
            })
            .catch((err) => {
                Log.warn(err, DOMAIN);
                return reject(err);
            })
    })
}

function createJsonForAllRegionDirs() {
    return new Promise((resolve, reject) => {
        McaParser.convertRegionDirToJSON(Config.OVERWORLD_DIR);
        McaParser.convertRegionDirToJSON(Config.NETHER_DIR);
        McaParser.convertRegionDirToJSON(Config.END_DIR);
        resolve();
    })
}

function combinePlayerData(uuid) {
    let readjsonPromises = [
        fs.readJSON(path.join(Config.STATS_DIR, `${uuid}.json`)),
        fs.readJSON(path.join(Config.TEMP_ADVANCEMENT_JSON_DIR, `${uuid}.json`)),
        fs.readJSON(path.join(Config.TEMP_PLAYERDATA_JSON_DIR, `${uuid}.json`)),
        fs.readJSON(path.join(Config.TEMP_PROFILE_JSON_DIR, `${uuid}.json`)),
        fs.readJSON(path.join(Config.TEMP_LOG_JSON_DIR, `${uuid}.json`)),
    ];

    Promise.all(readjsonPromises).then((val) => {
        fs.writeJSON(path.join(Config.OUTPUT_DIR, `${uuid}.json`), {
            'uuid': uuid,
            'name': Config.PLAYERS[uuid],
            'stats': val[0],
            'advancements': val[1],
            'data': val[2],
            'profile': val[3],
            'log': val[4]
        }).then((val) => {
            Log.info(`Wrote output JSON for ${uuid}.`, DOMAIN);
            if (val) {
                Log.debug(val, DOMAIN);
            }
        }).catch((err) => {
            Log.warn(`Failed to build output for ${uuid}.`, DOMAIN);
            Log.warn(err, DOMAIN);
        });
    });
}

function buildTileEntityList(mcaJsonDir) {
    let jsonregionFiles = fs.readdirSync(mcaJsonDir);

    return new Promise((resolve, reject) => {
        Promise.all(jsonregionFiles.map((filename) => {
                // console.log(filename);
                return fs.readJSON(path.join(mcaJsonDir, filename))
            }))
            .then((chunklistJson) => {
                let tileEntities = {};
                chunklistJson.map((regionjson) => {
                    regionjson.map((chunkjson) => {
                        if (chunkjson.hasOwnProperty('TileEntities')) {
                            chunkjson.TileEntities.map((te) => {
                                if (!tileEntities.hasOwnProperty(te.id)) {
                                    tileEntities[te.id] = [];
                                }
                                tileEntities[te.id].push(te);
                            })
                        }
                    });
                });
                return resolve(tileEntities);
            })
            .catch((err) => {
                return reject(err);
            })
    });
}



///// MAIN ///////

ProfileHelper.updateProfiles().then((val) => { // GET PLAYER INFORMATION FROM MOJANG
        return createJsonForAllRegionDirs()
    }).then((val) => {
        Log.info('Finished saving chunks to JSON', DOMAIN);
        return val;
    }).then((val) => {
        return PlayerData.convertPlayerdatFiles() // CONVERT PLAYER.DAT FILES
    })
    .then(val => {
        return AdvancementsParser.parseAndSaveAdvancementFiles();
    })
    .then(val => {
        return AdvancementsParser.createServerAdvancementProgress();
    })
    .then((val) => {
        return performLogOperations() // CONVERT LOG FILES
    }).then((logopResp) => {
        Log.info('All log operations completed', DOMAIN);
        fs.writeJsonSync(path.join(Config.OUTPUT_DIR, 'uuids.json'), Config.PLAYERS);
        return Promise.all(Object.keys(Config.PLAYERS).map((uuid) => {
            return combinePlayerData(uuid)
        }));
    }).then((val) => {
        Log.info('Copied player info to output directory', DOMAIN);
        return buildTileEntityList(path.join(Config.WORK_DIR, 'mcajson', 'overworld'));
    }).then((overworldTEJson) => {
        let teWithItems = [],
            mobSpawners = [],
            signs = [],
            lootables = {};
        Object.keys(overworldTEJson).map((tilentid) => {
            overworldTEJson[tilentid].map((tileent) => {
                if (tileent.id === 'minecraft:mob_spawner') {
                    mobSpawners.push({
                        SpawnData: tileent.SpawnData,
                        pos: [
                            tileent.x,
                            tileent.y,
                            tileent.z
                        ]
                    });
                } else if (tileent.id === 'minecraft:sign') {
                    signs.push({
                        Text: [
                            JSON.parse(tileent.Text1.replace(/\\"/, "'")).text,
                            JSON.parse(tileent.Text2.replace(/\\"/, "'")).text,
                            JSON.parse(tileent.Text3.replace(/\\"/, "'")).text,
                            JSON.parse(tileent.Text4.replace(/\\"/, "'")).text
                        ],
                        Color: tileent.Color,
                        pos: [
                            tileent.x,
                            tileent.y,
                            tileent.z
                        ]
                    });
                } else if (tileent.hasOwnProperty('Items')) {
                    if (tileent.Items.length > 0) {
                        teWithItems.push({
                            Items: tileent.Items,
                            pos: [
                                tileent.x,
                                tileent.y,
                                tileent.z
                            ],
                            id: tileent.id
                        })
                    }
                } else if (tileent.hasOwnProperty('LootTable')) {
                    let loottype = tileent.LootTable.split('/')[1];
                    if (!lootables.hasOwnProperty(loottype)) {
                        lootables[loottype] = [];
                    }
                    lootables[loottype].push({
                        type: loottype,
                        pos: [
                            tileent.x,
                            tileent.y,
                            tileent.z
                        ],
                        id: tileent.id
                    })
                }
            })
        })
        fs.writeJSONSync(path.join(Config.OUTPUT_DIR, 'overworld-spawners.json'), mobSpawners);
        fs.writeJSONSync(path.join(Config.OUTPUT_DIR, 'overworld-inventories.json'), teWithItems);
        fs.writeJSONSync(path.join(Config.OUTPUT_DIR, 'overworld-loot.json'), lootables);
        fs.writeJSONSync(path.join(Config.OUTPUT_DIR, 'overworld-signs.json'), signs);
        return fs.writeJSON(path.join(Config.OUTPUT_DIR, 'overworld-te.json'),
            overworldTEJson);
    }).then((val) => {
        Log.info('Wrote all TileEntity details to json.', DOMAIN);
    }).catch((err) => {
        console.log(err)
    });