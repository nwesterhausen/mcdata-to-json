import fs from 'fs-extra';
import path from 'path';
import log from './CustomLogger';
import Config from './Configuration';

const DOMAIN = 'Data Combiner';

let parseDeaths = function(uuid) {
        const NAME = Config.PLAYERS[uuid];

        return new Promise(((resolve, reject) => {
            fs.readJSON(path.join(Config.TEMP_DIR, 'logs', 'deaths.json')).then(
                (val) => {
                    let pdeaths = [];
    
                    for (let i = 0; i < val.length; i++) {
                        if (val[i].description.startsWith(NAME)) {
                            pdeaths.push(val[i]);
                        }
                    }
                    resolve(pdeaths);
                }
            ).catch((err) => {
                log.warn(`parseDeaths: ${err}`, DOMAIN);
            });
        }));
    },
    combinePlayerData = function(uuid) {
        let readjsonPromises = [
            fs.readJSON(path.join(Config.STATS_DIR, `${uuid}.json`)),
            fs.readJSON(path.join(Config.ADVANCEMENTS_DIR, `${uuid}.json`)),
            fs.readJSON(path.join(Config.TEMP_DIR, 'playerdata', `${uuid}.json`)),
            fs.readJSON(path.join(Config.TEMP_DIR, 'profiles', `${uuid}.json`)),
            parseDeaths(uuid)
        ];

        Promise.all(readjsonPromises).then( (val) => {
            fs.writeJSON(path.join(Config.OUTPUT_DIR, `${uuid}.json`), {
                'uuid': uuid,
                'name': Config.PLAYERS[uuid],
                'stats': val[0],
                'advancements': val[1],
                'data': val[2],
                'profile': val[3],
                'deaths': val[4]
            }).then( (val) => {
                log.info(`Wrote output JSON for ${uuid}.`, DOMAIN);
                if (val) {
                    log.debug(val, DOMAIN);
                }
            }).catch( (err) => {
                log.warn(`Failed to build output for ${uuid}.`, DOMAIN);
                log.warn(err, DOMAIN);
            });
        });
    };

export default {
    combinePlayerData
};
