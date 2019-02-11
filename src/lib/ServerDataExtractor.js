/**
 * Tool to create JSON files with minecraft server data:
 * blocks, items, advancements are all used by scripts.
 */
import fs from 'fs-extra';
import path from 'path';
import log from './CustomLogger';
import config from './Configuration';

const StreamZip = require('node-stream-zip');
const DOMAIN = 'DataExtractor';
let advancementsExported = false,
    loottablesExported = false,
    recipesExported = false,
    tagsExported = false,
    structuresExported = false,
    advancementsOutputPath = path.join(config.DATA_DIR, 'minecraft', 'advancements'),
    loottablesOutputPath = path.join(config.DATA_DIR, 'minecraft', 'loot_tables'),
    recipesOutputPath = path.join(config.DATA_DIR, 'minecraft', 'recipes'),
    structuresOutputPath = path.join(config.DATA_DIR, 'minecraft', 'structures'),
    tagsOutputPath = path.join(config.DATA_DIR, 'minecraft', 'tags');

let extractMinecraftDataPromise = function() {
        let serverzipPath = path.join(config.TEMP_DIR, 'server.zip');

        log.debug(`Trying to extract from ${config.MCJAR_FILE} by copying to ${serverzipPath}`, DOMAIN);
        fs.copyFileSync(config.MCJAR_FILE, serverzipPath);
        const zip = new StreamZip({
            'file': serverzipPath
        });

        return new Promise( (resolve, reject) => {
            zip.on('error', (err) => {
                log.error(`Zip failed to open. ${err}`, DOMAIN);
                reject();
            });
            // zip.on('extract', (entry, file) => {
            //     log.debug(`Extracted ${entry.name} to ${file}`, DOMAIN);
            // });
            zip.on('ready', () => {
                zip.extract('data', config.DATA_DIR, (err, count) => {
                    if (err) {
                        log.error(`Error extracting data from zip: ${err}`);
                        zip.close();
                        reject(err);
                    } else {
                        log.debug(`Extracted ${count} items from ${serverzipPath}`, DOMAIN);
                        zip.extract('assets', config.ASSETS_DIR, (err1, count1) => {
                            if (err) {
                                log.error(`Error extracting lang from zip: ${err1}`, DOMAIN);
                                zip.close();
                                reject(err1);
                            } else {
                                log.debug(`Extracted ${count1} items from ${serverzipPath}`, DOMAIN);
                                zip.close();
                                resolve();
                            }
                        });
                    }
                });
            });
        });
    },
    runDataGenerator = function() {
        log.info('Extracting data from server.jar (unzipping).', DOMAIN);
        extractMinecraftDataPromise().then( (val) => {
            log.debug(val, DOMAIN);
        }).catch( (val) => {
            log.error(val, DOMAIN);
        });
    },
    checkForData = function() {
        log.debug('Resetting data export status.', DOMAIN);
        advancementsExported = false;
        loottablesExported = false;
        recipesExported = false;
        structuresExported = false;
        tagsExported = false;
        // blocklistExported = false;
        // commandlistExported = false;
        // registriesExported = false;
        if (fs.existsSync(config.DATA_DIR)) {
            if (fs.existsSync(path.join(config.DATA_DIR, 'minecraft'))) {
                advancementsExported = fs.existsSync(advancementsOutputPath);
                loottablesExported = fs.existsSync(loottablesOutputPath);
                recipesExported = fs.existsSync(recipesOutputPath);
                structuresExported = fs.existsSync(structuresOutputPath);
                tagsExported = fs.existsSync(tagsOutputPath);
            }
            // if (fs.existsSync(path.join(tempRoot, 'data', 'reports'))) {
            //     blocklistExported = fs.existsSync(path.join(tempRoot, 'data', 'reports', 'blocks.json'));
            //     commandlistExported = fs.existsSync(path.join(tempRoot, 'data', 'reports', 'commands.json'));
            //     registriesExported = fs.existsSync(path.join(tempRoot, 'data', 'reports', 'registries.json'));
            // }
        }
        log.debug(`advancements data is cached: ${advancementsExported}`, DOMAIN);
        log.debug(`loottables data is cached: ${loottablesExported}`, DOMAIN);
        log.debug(`recipes data is cached: ${recipesExported}`, DOMAIN);
        log.debug(`recipes data is cached: ${structuresExported}`, DOMAIN);
        log.debug(`tags data is cached: ${tagsExported}`, DOMAIN);
        // log.debug(`blocklist data is cached: ${blocklistExported}`, DOMAIN);
        // log.debug(`commandlist data is cached: ${commandlistExported}`, DOMAIN);
        // log.debug(`registries data is cached: ${registriesExported}`, DOMAIN);
        let retval = advancementsExported & loottablesExported & recipesExported & structuresExported & tagsExported;

        log.debug(`checkForData returning ${retval}`, DOMAIN);
        return retval;
    };

export default {
    runDataGenerator,
    advancementsExported,
    loottablesExported,
    recipesExported,
    tagsExported,
    checkForData,
    extractMinecraftDataPromise
};
