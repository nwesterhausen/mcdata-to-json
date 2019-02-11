import Config from './lib/Configuration';
import fs from 'fs-extra';
import path from 'path';
import nbt from 'nbt';
import log from './lib/CustomLogger';

const PLAYERDATA_FILES = fs.readdirSync(Config.PLAYERDATA_DIR),
    PLAYERDATAJSON_DIR = path.join(Config.TEMP_DIR, 'playerdata'),
    DOMAIN = 'NBT Parser';

fs.ensureDirSync(PLAYERDATAJSON_DIR);

let parsePlayerdata = function() {
    for (let i = 0; i < PLAYERDATA_FILES.length; i++) {
        const uuid = PLAYERDATA_FILES[i].replace(/\.dat/, '');

        log.debug(`Running parse on ${uuid}`, DOMAIN);

        fs.readFile(path.join(Config.PLAYERDATA_DIR, PLAYERDATA_FILES[i]), (err, data) => {
            if (err) {
                throw err;
            }
            nbt.parse(data, (error, nbtdata) => {
                if (error) {
                    throw error;
                }
                fs.writeJSON(path.join(PLAYERDATAJSON_DIR, `${uuid}.json`), nbtdata);
            });
        });
    }
};

export default {
    parsePlayerdata
};
