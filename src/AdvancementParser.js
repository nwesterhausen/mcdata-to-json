/**
 Advancement requirements are in:
 DATAPACKS:: root/world/datapacks/<name>/advancements/[category]/*.json
 VANILLA  :: root/generated/data/minecraft/advancements

 Advancement progress:
 world/advancement/UUID.json
 timestamped on when completed
 **/

/**
 * Advancement JSON Struct (simplified)
 * {
 *   display: {
 *       icon: {
 *          item: minecraft:id
 *       }
 *       title: {
 *           translate: Atlantis
 *       }
 *       description: {
 *          translate: Description string
 *        }
 *       frame: Not needed if default; either challenge | goal
 *   },
 *   criteria: {
 *       criteria1: {},
 *       criteria2: {}
 *   }
 * }
 ***/
import path from 'path';
import log from './lib/CustomLogger';

const DOMAIN = 'AdvancementParser';
let workdir = 'unset',
    playerProgressDir = 'unset',
    advancementDefinitions = {};

export default {
    'setConfig': function(config) {
        workdir = config.TEMP_DIR;
        playerProgressDir = path.join(config.MC_DIR, 'world', 'advancements');
    }
};
