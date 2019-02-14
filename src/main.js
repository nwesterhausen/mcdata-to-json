import Config from './Configuration';
import Log from './lib/CustomLogger';
import MojangAPI from './lib/MojangAPI';
import PlayerData from './lib/PlayerData';
import LogParser from './lib/log/Parser';
import MCAParser from './lib/McaParser';

import path from 'path';
import fs from 'fs-extra';
import McaParser from './lib/McaParser';

const DOMAIN = 'Main',
    PLAYER_PROFILE_CACHE_DIR = path.join(Config.TEMP_DIR, 'profiles'),
    PROFILE_CACHE_ACCEPTABLE_AGE = (1000 * 60 * 60 * 4); // 4 hours

fs.ensureDirSync(PLAYER_PROFILE_CACHE_DIR);

function updateProfiles(honorCache = true) {
    let uuid_list = Object.keys(Config.PLAYERS);
    return Promise.all(uuid_list.map((uuid) => {
        const cachedPlayerProfile = path.join(PLAYER_PROFILE_CACHE_DIR, `${uuid}.json`);
        let shouldQueryProfile = true;

        if (fs.existsSync(cachedPlayerProfile)) {
            shouldQueryProfile = (Date.now() - fs.statSync(cachedPlayerProfile).mtime > PROFILE_CACHE_ACCEPTABLE_AGE || !honorCache)
        }

        if (shouldQueryProfile) {
            Log.debug(`Updating Mojang profile on disk for ${uuid}`, DOMAIN);
            return new Promise((resolve, reject) => {
                MojangAPI.getProfileForUUID(uuid).then((profileResp) => {
                    Log.debug(`Profile for ${uuid} ${profileResp.status} ${profileResp.statusText}`, DOMAIN);
                    if (profileResp.data) {
                        let cleanedProfileJSON = MojangAPI.jsonFromProfileResp(profileResp.data);

                        return fs.writeJSON(cachedPlayerProfile, cleanedProfileJSON, {
                            'spaces': 2
                        });
                    }
                }).then((res) => {
                    Log.info(`Cached new profile data for ${uuid}`, DOMAIN);
                }).catch((err) => {
                    if (err.message.indexOf('code 429')) {
                        Log.warn('Too many requests to Mojang API.', DOMAIN);
                    } else
                        Log.warn(err, DOMAIN);
                });
            });
        } else {
            Log.info(`No need to update Mojang profile for ${Config.PLAYERS[uuid]}, cache is younger than 4 hours`, DOMAIN);
        }
    }))

}

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
        fs.readJSON(path.join(Config.ADVANCEMENTS_DIR, `${uuid}.json`)),
        fs.readJSON(path.join(Config.TEMP_DIR, 'playerdata', `${uuid}.json`)),
        fs.readJSON(path.join(PLAYER_PROFILE_CACHE_DIR, `${uuid}.json`)),
        fs.readJSON(path.join(Config.TEMP_DIR, 'logs', `${uuid}.json`)),
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

updateProfiles().then((val) => { // GET PLAYER INFORMATION FROM MOJANG
        return createJsonForAllRegionDirs()
    }).then((val) => {
        Log.info('Finished saving chunks to JSON', DOMAIN);
    }).then((val) => {
        return PlayerData.convertPlayerdatFiles() // CONVERT PLAYER.DAT FILES
    })
    .then((val) => {
        return performLogOperations() // CONVERT LOG FILES
    }).then((logopResp) => {
        Log.info('All log operations completed', DOMAIN);
        return Promise.all(Object.keys(Config.PLAYERS).map((uuid) => {
            return combinePlayerData(uuid)
        }));
    }).then((val) => {
        Log.info('Copied player info to output directory', DOMAIN);
    });