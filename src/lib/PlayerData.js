import Log from './CustomLogger';
import NbtTools from './NbtTools';
import Config from '../Configuration';

import fs from 'fs-extra';
import path from 'path';

const DOMAIN = 'Player.dat Operations',
    PLAYERDATA_JSON_CACHE_DIR = path.join(Config.TEMP_DIR, 'playerdata');

fs.ensureDirSync(PLAYERDATA_JSON_CACHE_DIR);

function convertPlayerdat(datfilename) {
    const PLAYERDATA_JSON_CACHE_FILE = path.join(
        PLAYERDATA_JSON_CACHE_DIR, datfilename.replace(/.dat/, '.json'));
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(Config.PLAYERDATA_DIR, datfilename))
            .then((filedata) => {
                return NbtTools.nbtToJson(filedata);
            })
            .then((cleanJson) => {
                return fs.writeJSON(PLAYERDATA_JSON_CACHE_FILE, cleanJson, {
                    'spaces': 2
                });
            })
            .then((res) => {
                Log.info(`Parsed NBT ${path.basename(PLAYERDATA_JSON_CACHE_FILE).replace(/.json/, '')}`, DOMAIN);
                return resolve(res);
            })
            .catch((err) => {
                Log.warn(`Error when reading dat file. ${err}`, DOMAIN);
                return reject(err);
            });
    });
}

function convertPlayerdatFiles() {
    return new Promise((resolve, reject) => {
        Promise.all(fs.readdirSync(Config.PLAYERDATA_DIR).map(convertPlayerdat))
            .then((val) => {
                return resolve(val)
            })
            .catch((err) => {
                return reject(err)
            })
    })
}



export default {
    convertPlayerdat,
    convertPlayerdatFiles
}