const { PLAYERS, ACCEPTABLE_PROFILE_AGE } = require("./Configuration");
const PATHS = require("./helpers/PathRefrence").paths;
const logger = require("./helpers/Logger").getLogger();
const MojangAPI = require("./MojangApi");
const path = require("path");
const fs = require("fs");

const DOMAIN = "Profile Collector";

module.exports = {
  updateProfiles: function (honorCache = true) {
    const UuidList = Object.keys(PLAYERS);
    logger.debug(`Creating promises to gather data from Mojang for ${UuidList.length} players`, { domain: DOMAIN });
    return Promise.all(
      UuidList.map((uuid) => {
        const cachedPlayerProfile = path.join(PATHS.TEMP_PROFILE_JSON_DIR, `${uuid}.json`);
        let shouldQueryProfile = true;

        if (fs.existsSync(cachedPlayerProfile)) {
          shouldQueryProfile =
            Date.now() - fs.statSync(cachedPlayerProfile).mtime > ACCEPTABLE_PROFILE_AGE || !honorCache;
        }

        if (shouldQueryProfile) {
          logger.debug(`Updating Mojang profile on disk for ${uuid}`, { domain: DOMAIN });
          return MojangAPI.getProfileForUUID(uuid)
            .then((profileResp) => {
              logger.debug(`Profile for ${uuid} ${profileResp.status} ${profileResp.statusText}`, { domain: DOMAIN });
              if (profileResp.data) {
                const cleanedProfileJSON = MojangAPI.jsonFromProfileResp(profileResp.data);

                return fs.promises.writeFile(cachedPlayerProfile, JSON.stringify(cleanedProfileJSON));
              }
            })
            .then((res) => {
              logger.verbose(`Cached new profile data for ${uuid}`, { domain: DOMAIN });
              logger.debug(res, { domain: DOMAIN });
            })
            .catch((err) => {
              if (err.message.indexOf("code 429") !== -1) {
                logger.warn("Too many requests to Mojang API.", { domain: DOMAIN });
              }
              logger.warn(err, { domain: DOMAIN });
            });
        } else {
          logger.verbose(`No need to update Mojang profile for ${PLAYERS[uuid]}, cache is younger than 4 hours`, {
            domain: DOMAIN,
          });
        }
      })
    );
  },
};
