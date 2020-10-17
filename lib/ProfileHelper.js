const { PLAYERS, ACCEPTABLE_PROFILE_AGE } = require("./Configuration");
const PATHS = require("./helpers/PathReference").paths;
const logger = require("./helpers/Logger").getLogger();
const MojangAPI = require("./MojangApi");
const path = require("path");
const fs = require("fs");

const DOMAIN = "Profile Collector";

module.exports = { updateProfiles };
/**
 *
 * @param {boolean} honorCache
 */
function updateProfiles(honorCache = true) {
  for (const uuid of Object.keys(PLAYERS)) {
    if (typeof uuid === "string") {
      const TMP_PLAYER_DIR = path.join(PATHS.TEMP_PLAYERDATA_DIR, uuid);
      const CACHED_PLAYER_PROFILE = path.join(TMP_PLAYER_DIR, "profile.json");

      let shouldQueryProfile = true;

      if (fs.existsSync(CACHED_PLAYER_PROFILE)) {
        shouldQueryProfile =
          Date.now() - fs.statSync(CACHED_PLAYER_PROFILE).mtime > ACCEPTABLE_PROFILE_AGE || !honorCache;
      }

      if (shouldQueryProfile) {
        logger.debug(`Updating Mojang profile on disk for ${uuid}`, { domain: DOMAIN });
        MojangAPI.getProfileForUUID(uuid)
          .then((profileResp) => {
            logger.debug(`Profile for ${uuid} ${profileResp.status} ${profileResp.statusText}`, { domain: DOMAIN });
            return new Promise((resolve, reject) => {
              if (profileResp.data) {
                const cleanedProfileJSON = MojangAPI.jsonFromProfileResp(profileResp.data);
                try {
                  resolve(JSON.stringify(cleanedProfileJSON));
                } catch (e) {
                  reject(e);
                }
              } else {
                reject(
                  new Error(`EPROFILEAPI: No data in response from MojangAPI\n${JSON.stringify(profileResp, null, 2)}`)
                );
              }
            });
          })
          .then((stringified) => {
            return fs.promises.writeFile(CACHED_PLAYER_PROFILE, stringified);
          })
          .then((res) => {
            logger.verbose(`Cached new profile data for ${uuid}`, { domain: DOMAIN });
            logger.debug(res, { domain: DOMAIN });
          })
          .catch((err) => {
            if (err.message.indexOf("code 429") !== -1) {
              logger.warn("Too many requests to Mojang API.", { domain: DOMAIN });
            }
            logger.warn(JSON.stringify(err), { domain: DOMAIN });
          });
      } else {
        logger.verbose(`No need to update Mojang profile for ${PLAYERS[uuid]}, cache is younger than 4 hours`, {
          domain: DOMAIN,
        });
      }
    } else {
      logger.debug(`PLAYERS may not have accurate content. PLAYERS.${uuid} = ${PLAYERS[uuid]}`, { domain: DOMAIN });
    }
  }
}
