/**
 * Tool to create JSON files with minecraft server data:
 * blocks, items, advancements are all used by scripts.
 */
import fs from 'fs-extra';
import path from 'path';
import cp from 'child_process';
import log from './CustomLogger';

const DOMAIN = 'DataExtrator';
let minecraftRoot = 'unset',
    tempRoot = 'unset',
    serverjarPath = 'unset';

let exportMinecraftAdvancementsPromise = function() {
        return new Promise((resolve, reject) => {
            log.debug(DOMAIN, 'Running minecraft data export from server jar.');
            if (tempRoot === 'unset' || serverjarPath === 'unset') {
                log.error(DOMAIN, 'Tried to run data generation without setting serverjar and/or output folder.');
                log.error(DOMAIN, `datadir: ${tempRoot}, serverjar: ${serverjarPath}`);
                reject('Failed to set directories.');
            }
            cp.exec(`java -cp ${serverjarPath} net.minecraft.data.Main --server --output ${tempRoot}`,
                (err, stdout, stderr) => { // eslint-disable-line 
                    if (err) {
                        log.error(DOMAIN, 'Failed to run command to export minecraft data.');
                        log.error(DOMAIN, err);
                        reject(err);
                    } else {
                        log.info(DOMAIN, 'Completed export of minecraft data.');
                        resolve(stdout);
                    }
                });
        });
    },
    exportMinecraftAdvancements = function() {
        log.debug(DOMAIN, 'Checking for data already in output folder.');
        if (!fs.existsSync(path.join(tempRoot, 'data'))) {
            log.info(DOMAIN, 'Using server.jar to generate advancement data.');
            exportMinecraftAdvancementsPromise().then( (val) => {
                log.debug(DOMAIN, val);
            });
        } else {
            log.info(DOMAIN, `Using cached minecraft report data in ${path.join(tempRoot, 'data')}`);
        }
    };

export default {
    'setMinecraftRoot': function(mcpath) {
        minecraftRoot = mcpath;
        serverjarPath = path.join(mcpath, 'server.jar');
    },
    'setTempRoot': function(temproot) {
        tempRoot = temproot;
    },
    exportMinecraftAdvancements
};
