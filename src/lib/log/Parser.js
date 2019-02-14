import Constants from './Constants';
import Config from '../../Configuration';
import LogfileTools from './Tools';
import Log from '../CustomLogger';

import zlib from 'zlib';
import fs from 'fs-extra';
import path from 'path';
import readline from 'readline';

const DOMAIN = 'Logs Parser',
    LOG_JSON_CACHE_DIR = path.join(Config.TEMP_DIR, 'logs');

let rawlogJSON = [],
    cleanedJSON = [],
    latestlogDate = "",
    updateLatestLogDate = function () {
        latestlogDate = fs.statSync(path.join(Config.LOGS_DIR, 'latest.log')).mtime.toISOString();
        Log.debug(`latest.log date: ${ latestlogDate }`, DOMAIN);
    };

fs.ensureDirSync(LOG_JSON_CACHE_DIR);

updateLatestLogDate();

function mclogToJson(logfilename) {
    const FILE_EXTENSION = path.extname(logfilename);
    // Check if we previous created a JSON file for this region. If so, skip!
    if (fs.existsSync(path.join(LOG_JSON_CACHE_DIR, `${logfilename.split('.')[0]}.json`))) {
        if (fs.statSync(LOG_JSON_CACHE_DIR, `${logfilename.split('.')[0]}.json`).mtime >
            fs.statSync(path.join(Config.LOGS_DIR, logfilename)).mtime) {
            if (FILE_EXTENSION === '.log') {
                Log.debug(`The JSON version of ${logfilename} is up to date.`, DOMAIN);
                let logjs = fs.readJSONSync(path.join(LOG_JSON_CACHE_DIR,
                    `${logfilename.split('.')[0]}.json`));
                rawlogJSON.push(...logjs);
            }
            return;
        }
    }

    if (FILE_EXTENSION === '.gz') {
        let newLogfilename = unzipLogFile(logfilename);
        return mclogToJson(newLogfilename);
    }
    const createdDate = LogfileTools.getDateFromFilename(logfilename);
    return new Promise((resolve, reject) => {
        let createdJSON = [];
        Log.debug(`Parsing ${logfilename} into JSON. (${createdDate})`, DOMAIN);

        const linereader = readline.createInterface({
            'input': fs.createReadStream(
                path.join(Config.LOGS_DIR, logfilename)
            )
        });
        linereader.on('line', (input) => {
            LogfileTools.appendLogActionTo(
                createdJSON,
                LogfileTools.parseLogLine(createdDate, input)
            );
        });
        linereader.on('close', () => {
            if (createdJSON.length === 0) {
                Log.warn(`${logfilename} parsed into empty array. Not saving.`, DOMAIN);
            } else {
                Log.debug(`Completed JSON conversion of ${logfilename}`, DOMAIN);
                rawlogJSON.push(...createdJSON);
                fs.writeJSON(
                        path.join(LOG_JSON_CACHE_DIR, `${logfilename.replace(/.log/, '.json')}`),
                        createdJSON, {
                            'spaces': 2
                        })
                    .then((val) => {
                        Log.debug(`Wrote ${logfilename.replace(/.log/, '.json')}.`);
                        return resolve(val);
                    })
                    .catch((err) => {
                        Log.warn(`Error writing log JSON: ${err}`)
                        return reject(err);
                    });
            }
        });

    });
}

function unzipLogFile(gzipLogfile) {
    Log.debug(`Going to decompress ${gzipLogfile}`, DOMAIN);
    let compressedFilehandle = fs.readFileSync(path.join(Config.LOGS_DIR, gzipLogfile));
    let unzippedData = zlib.unzipSync(compressedFilehandle);
    fs.writeFileSync(
        path.join(Config.LOGS_DIR, gzipLogfile.replace(/.gz/, '')),
        unzippedData
    );
    return gzipLogfile.replace(/.gz/, '');
}

function sortRawlogJSON() {
    rawlogJSON.sort((a, b) => {
        return a.timestamp - b.timestamp;
    });
}

function buildCombinedLogfiles() {
    // 'Clean' JSON
    // no 'moved too quickly!'
    // no 'server overloaded!'
    // no 'keeping entity @e'
    cleanedJSON = rawlogJSON.filter((obj) => {
        return [Constants.TYPE_KEEPENTITY, Constants.TYPE_OVERLOADED, Constants.TYPE_MOVEDQUICKLY, Constants.TYPE_PREPARESPAWN, Constants.TYPE_ARGUMENTABIGUITY].indexOf(obj.type) === -1;
    });
    fs.writeJSONSync(path.join(LOG_JSON_CACHE_DIR, 'filtered_logs.json'), cleanedJSON, {
        'spaces': 2
    });
    Log.debug(`Wrote 'cleaned' JSON file to ${path.join(LOG_JSON_CACHE_DIR, 'filtered_logs.json')} (${cleanedJSON.length} records)`, DOMAIN);

    // Only chat messages
    let chatJSON = cleanedJSON.filter((obj) => {
        return obj.type === Constants.TYPE_CHAT;
    });
    fs.writeJSONSync(path.join(LOG_JSON_CACHE_DIR, 'chat.json'), chatJSON, {
        'spaces': 2
    });
    Log.debug(`Wrote 'chat' JSON file to ${path.join(LOG_JSON_CACHE_DIR, 'chat.json')} (${chatJSON.length} records)`, DOMAIN);

    // Only command messages
    let commandJSON = cleanedJSON.filter((obj) => {
        return obj.type === Constants.TYPE_COMMAND;
    });
    fs.writeJSONSync(path.join(LOG_JSON_CACHE_DIR, 'command.json'), commandJSON, {
        'spaces': 2
    });
    Log.debug(`Wrote 'command' JSON file to ${path.join(LOG_JSON_CACHE_DIR, 'command.json')} (${commandJSON.length} records)`, DOMAIN);

    // Only command messages
    let deathJSON = cleanedJSON.filter((obj) => {
        return obj.type <= 20;
    });
    fs.writeJSONSync(path.join(LOG_JSON_CACHE_DIR, 'deaths.json'), deathJSON, {
        'spaces': 2
    });
    Log.debug(`Wrote 'command' JSON file to ${path.join(LOG_JSON_CACHE_DIR, 'deaths.json')} (${deathJSON.length} records)`, DOMAIN);
}

function buildPlayerLogfiles() {
    let uuid_list = Object.keys(Config.PLAYERS);
    uuid_list.map((uuid) => {
        let thisPlayersLog = [];
        let pattern = `(${uuid}|${Config.PLAYERS[uuid]})`;
        let playernameRegex = new RegExp(pattern);
        thisPlayersLog = cleanedJSON.filter((logEntry) => {
            if (!logEntry.hasOwnProperty('description')) {
                return false;
            }
            if (logEntry.type === Constants.TYPE_CHAT) {
                return logEntry.description.player === Config.PLAYERS[uuid];
            }
            return logEntry.description.match(playernameRegex);
        })
        fs.writeJsonSync(path.join(LOG_JSON_CACHE_DIR, `${uuid}.json`), thisPlayersLog, {
            'spaces': 2
        });
        Log.debug(`Wrote log entries for ${Config.PLAYERS[uuid]}`, DOMAIN);
    })

}

export default {
    mclogToJson,
    latestlogDate,
    buildCombinedLogfiles,
    buildPlayerLogfiles,
    sortRawlogJSON
}