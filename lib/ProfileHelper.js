const Config = require("./Configuration");
const Log = require("./CustomLogger");
const MojangAPI = require("./MojangApi");
const path = require("path");
const fs = require("fs");

const DOMAIN = "Profile Collector";

module.exports = {
  updateProfiles: function (honorCache = true) {
    let uuid_list = Object.keys(Config.PLAYERS);
    return Promise.all(
      uuid_list.map((uuid) => {
        const cachedPlayerProfile = path.join(Config.TEMP_PROFILE_JSON_DIR, `${uuid}.json`);
        let shouldQueryProfile = false;

        if (fs.existsSync(cachedPlayerProfile)) {
          shouldQueryProfile =
            Date.now() - fs.statSync(cachedPlayerProfile).mtime > Config.ACCEPTABLE_PROFILE_AGE || !honorCache;
        }

        if (shouldQueryProfile) {
          Log.debug(`Updating Mojang profile on disk for ${uuid}`, DOMAIN);
          return new Promise((resolve, reject) => {
            MojangAPI.getProfileForUUID(uuid)
              .then((profileResp) => {
                Log.debug(`Profile for ${uuid} ${profileResp.status} ${profileResp.statusText}`, DOMAIN);
                if (profileResp.data) {
                  let cleanedProfileJSON = MojangAPI.jsonFromProfileResp(profileResp.data);

                  return fs.writeJSON(cachedPlayerProfile, cleanedProfileJSON, {
                    spaces: 2,
                  });
                }
              })
              .then((res) => {
                Log.info(`Cached new profile data for ${uuid}`, DOMAIN);
              })
              .catch((err) => {
                if (err.message.indexOf("code 429")) {
                  Log.warn("Too many requests to Mojang API.", DOMAIN);
                } else Log.warn(err, DOMAIN);
              });
          });
        } else {
          Log.info(
            `No need to update Mojang profile for ${Config.PLAYERS[uuid]}, cache is younger than 4 hours`,
            DOMAIN
          );
        }
      })
    );
  },
};
