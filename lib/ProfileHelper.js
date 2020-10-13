const Config = require("./Configuration");
const Log = Config.logger;
const MojangAPI = require("./MojangApi");
const path = require("path");
const fs = require("fs");

const DOMAIN = "Profile Collector";

module.exports = {
  updateProfiles: function (honorCache = true) {
    const UuidList = Object.keys(Config.PLAYERS);
    Log.debug(`Creating promises to gather data from Mojang for ${UuidList.length} players`, { domain: DOMAIN });
    return Promise.all(
      UuidList.map((uuid) => {
        const cachedPlayerProfile = path.join(Config.TEMP_PROFILE_JSON_DIR, `${uuid}.json`);
        let shouldQueryProfile = true;

        if (fs.existsSync(cachedPlayerProfile)) {
          shouldQueryProfile =
            Date.now() - fs.statSync(cachedPlayerProfile).mtime > Config.ACCEPTABLE_PROFILE_AGE || !honorCache;
        }

        if (shouldQueryProfile) {
          Log.debug(`Updating Mojang profile on disk for ${uuid}`, { domain: DOMAIN });
          return MojangAPI.getProfileForUUID(uuid)
            .then((profileResp) => {
              Log.debug(`Profile for ${uuid} ${profileResp.status} ${profileResp.statusText}`, { domain: DOMAIN });
              if (profileResp.data) {
                const cleanedProfileJSON = MojangAPI.jsonFromProfileResp(profileResp.data);

                return fs.promises.writeFile(cachedPlayerProfile, JSON.stringify(cleanedProfileJSON));
              }
            })
            .then((res) => {
              Log.verbose(`Cached new profile data for ${uuid}`, { domain: DOMAIN });
              Log.debug(res, { domain: DOMAIN });
            })
            .catch((err) => {
              if (err.message.indexOf("code 429") !== -1) {
                Log.warn("Too many requests to Mojang API.", { domain: DOMAIN });
              }
              Log.warn(err, { domain: DOMAIN });
            });
        } else {
          Log.verbose(`No need to update Mojang profile for ${Config.PLAYERS[uuid]}, cache is younger than 4 hours`, {
            domain: DOMAIN,
          });
        }
      })
    );
  },
};
