const Config = require("./Configuration");
const Log = require("./CustomLogger");
const MojangAPI = require("./MojangApi");
const path = require("path");
const fs = require("fs");

const DOMAIN = "Profile Collector";

module.exports = {
  updateProfiles: function (honorCache = true) {
    const UuidList = Object.keys(Config.PLAYERS);
    Log.info(DOMAIN, `Creating promises to gather data from Mojang for ${UuidList.length} players`);
    return Promise.all(
      UuidList.map((uuid) => {
        const cachedPlayerProfile = path.join(Config.TEMP_PROFILE_JSON_DIR, `${uuid}.json`);
        let shouldQueryProfile = true;

        if (fs.existsSync(cachedPlayerProfile)) {
          shouldQueryProfile =
            Date.now() - fs.statSync(cachedPlayerProfile).mtime > Config.ACCEPTABLE_PROFILE_AGE || !honorCache;
        }

        if (shouldQueryProfile) {
          Log.debug(DOMAIN, `Updating Mojang profile on disk for ${uuid}`);
          return MojangAPI.getProfileForUUID(uuid)
            .then((profileResp) => {
              Log.debug(DOMAIN, `Profile for ${uuid} ${profileResp.status} ${profileResp.statusText}`);
              if (profileResp.data) {
                const cleanedProfileJSON = MojangAPI.jsonFromProfileResp(profileResp.data);

                return fs.promises.writeFile(cachedPlayerProfile, JSON.stringify(cleanedProfileJSON));
              }
            })
            .then((res) => {
              Log.info(DOMAIN, `Cached new profile data for ${uuid}`);
              Log.debug(DOMAIN, res);
            })
            .catch((err) => {
              if (err.message.indexOf("code 429") !== -1) {
                Log.warn(DOMAIN, "Too many requests to Mojang API.");
              }
              Log.warn(DOMAIN, err);
            });
        } else {
          Log.info(
            DOMAIN,
            `No need to update Mojang profile for ${Config.PLAYERS[uuid]}, cache is younger than 4 hours`
          );
        }
      })
    );
  },
};
