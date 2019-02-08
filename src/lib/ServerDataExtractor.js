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
    serverjarPath = 'unset',
    advancementsExported = false,
    loottablesExported = false,
    recipesExported = false,
    tagsExported = false,
    blocklistExported = false,
    commandlistExported = false,
    registriesExported = false;

let checkForData = function() {
        log.debug(DOMAIN, 'Resetting data export status.');
        advancementsExported = false;
        loottablesExported = false;
        recipesExported = false;
        tagsExported = false;
        blocklistExported = false;
        commandlistExported = false;
        registriesExported = false;
        if (fs.existsSync(path.join(tempRoot, 'data'))) {
            if (fs.existsSync(path.join(tempRoot, 'data', 'minecraft'))) {
                advancementsExported = fs.existsSync(path.join(tempRoot, 'data', 'minecraft', 'advancements'));
                loottablesExported = fs.existsSync(path.join(tempRoot, 'data', 'minecraft', 'loot_tables'));
                recipesExported = fs.existsSync(path.join(tempRoot, 'data', 'minecraft', 'recipes'));
                tagsExported = fs.existsSync(path.join(tempRoot, 'data', 'minecraft', 'tags'));
            }
            if (fs.existsSync(path.join(tempRoot, 'data', 'reports'))) {
                blocklistExported = fs.existsSync(path.join(tempRoot, 'data', 'reports', 'blocks.json'));
                blocklistExported = fs.existsSync(path.join(tempRoot, 'data', 'reports', 'commands.json'));
                blocklistExported = fs.existsSync(path.join(tempRoot, 'data', 'reports', 'registries.json'));
            }
        }
        log.debug(DOMAIN, `advancements data is cached: ${advancementsExported}`);
        log.debug(DOMAIN, `loottables data is cached: ${loottablesExported}`);
        log.debug(DOMAIN, `recipes data is cached: ${recipesExported}`);
        log.debug(DOMAIN, `tags data is cached: ${tagsExported}`);
        log.debug(DOMAIN, `blocklist data is cached: ${blocklistExported}`);
        log.debug(DOMAIN, `commandlist data is cached: ${commandlistExported}`);
        log.debug(DOMAIN, `registries data is cached: ${registriesExported}`);
    },
    exportMinecraftDataPromise = function() {
        return new Promise((resolve, reject) => {
            log.debug(DOMAIN, 'Running minecraft data export from server jar.');
            if (tempRoot === 'unset' || serverjarPath === 'unset') {
                log.error(DOMAIN, 'Tried to run data generation without setting serverjar and/or output folder.');
                log.error(DOMAIN, `datadir: ${tempRoot}, serverjar: ${serverjarPath}`);
                reject('Failed to set directories.');
            }
            cp.exec(`java -cp ${serverjarPath} net.minecraft.data.Main --all --output ${tempRoot}`,
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
    ensureMinecraftAdvancements = function() {
        log.debug(DOMAIN, 'Checking for data already in output folder.');
        if (!advancementsExported) {
            log.info(DOMAIN, 'Using server.jar to generate advancement data.');
            exportMinecraftDataPromise().then( (val) => {
                log.debug(DOMAIN, val);
            });
        } else {
            log.info(DOMAIN, `Using cached minecraft advancements in ${path.join(tempRoot, 'data', 'minecraft', 'advancements')}`);
        }
    };

export default {
    'setConfig': function(config) {
        minecraftRoot = config.MC;
        tempRoot = config.TEMP_DIR;
        serverjarPath = path.join(minecraftRoot, 'server.jar');
        checkForData();
    },
    ensureMinecraftAdvancements
};
