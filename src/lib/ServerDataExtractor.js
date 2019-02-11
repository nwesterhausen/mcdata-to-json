/**
 * Tool to create JSON files with minecraft server data:
 * blocks, items, advancements are all used by scripts.
 */
import fs from 'fs-extra';
import path from 'path';
import log from './CustomLogger';
import config from './Configuration';
import Progress from 'cli-progress';

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

let extractPromise = function(zippath, outpath, shortname = '', entryprefix = '') {

        const bar = new Progress.Bar({ 'format': `[{bar}] {percentage}% | {value}/{total} | ${shortname === '' ? path.basename(zippath) : shortname}` }, Progress.Presets.rect);
        const zip = new StreamZip({
            'file': zippath,
            'storeEntries': true
        });
        const ENTRY_PREFIX = entryprefix,
            OUTPUT_PATH = outpath,
            ZIPFILE_PATH = zippath;

        return new Promise( (resolve, reject) => {
            let entriesExtracted = 1;

            zip.on('error', (err) => {
                log.error(`Zip failed to open. ${err}`, DOMAIN);
                reject(err);
            });
            zip.on('extract', (entry, file) => {
                bar.update(entriesExtracted++);
            });
            zip.on('ready', () => {
                log.debug(`Entries read: ${zip.entriesCount}`, DOMAIN);
                let totalEntries = 0;

                for (const entry of Object.values(zip.entries())) {
                    if (entry.name.startsWith(ENTRY_PREFIX)) {
                        totalEntries++;
                    }
                }
                log.debug(`${totalEntries} entries under '${ENTRY_PREFIX}'`, DOMAIN);
                bar.start(totalEntries, 0);
                zip.extract(ENTRY_PREFIX, OUTPUT_PATH, (err, count) => {
                    if (err) {
                        log.error(`Error extracting data from zip: ${err}`);
                        zip.close();
                        reject(err);
                    } else {
                        log.debug(`Extracted ${count} items from ${ZIPFILE_PATH}`, DOMAIN);
                        bar.update(bar.getTotal());
                        bar.stop();
                        zip.close();
                        resolve(`Extracted ${count} items from ${ZIPFILE_PATH}`);
                    }
                });
            });
        });
    },
    extractMinecraftDataPromise = function() {
        let serverzipPath = path.join(config.TEMP_DIR, 'server.zip');

        log.debug(`Trying to extract from ${config.MCJAR_FILE} by copying to ${serverzipPath}`, DOMAIN);
        fs.copyFileSync(config.MCJAR_FILE, serverzipPath);

        return extractPromise(serverzipPath, config.DATA_DIR, `${path.basename(config.MCJAR_FILE)} data`, 'data/');
    },
    extractMinecraftAssetsPromise = function() {
        let serverzipPath = path.join(config.TEMP_DIR, 'server.zip');

        log.debug(`Trying to extract from ${config.MCJAR_FILE} by copying to ${serverzipPath}`, DOMAIN);
        fs.copyFileSync(config.MCJAR_FILE, serverzipPath);

        return extractPromise(serverzipPath, config.ASSETS_DIR, `${path.basename(config.MCJAR_FILE)} assets`, 'assets/');
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
    extractMinecraftDataPromise,
    extractMinecraftAssetsPromise,
    extractPromise
};
