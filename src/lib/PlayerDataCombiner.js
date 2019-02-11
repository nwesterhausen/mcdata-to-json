import fs from 'fs-extra';
import path from 'path';
import log from './CustomLogger';
import Config from './Configuration';

const DOMAIN = 'Data Combiner';

let combinePlayerData = function(uuid) {
    let readjsonPromises = [
        fs.readJSON(path.join(Config.STATS_DIR, `${uuid}.json`)),
        fs.readJSON(path.join(Config.ADVANCEMENTS_DIR, `${uuid}.json`)),
        fs.readJSON(path.join(Config.TEMP_DIR, 'playerdata', `${uuid}.json`)),
        fs.readJSON(path.join(Config.TEMP_DIR, 'profiles', `${uuid}.json`))
    ];

    Promise.all(readjsonPromises).then( (val) => {
        fs.writeJSON(path.join(Config.OUTPUT_DIR, `${uuid}.json`), {
            'uuid': uuid,
            'name': Config.PLAYERS[uuid],
            'stats': val[0],
            'advancements': val[1],
            'data': val[2],
            'profile': val[3]
        }).then( (val) => {
            log.info(`Wrote output JSON for ${uuid}.`, DOMAIN);
        })
    });
};

export default {
    combinePlayerData
};
