const Axios = require("axios");
const Log = require("./CustomLogger");

const BASE_API_URL = "https://sessionserver.mojang.com/session/minecraft/profile",
  DOMAIN = "MojangAPI Runner";

let uriEncodeUUID = function (uuid) {
    return uuid.replace(/-/g, "");
  },
  uriDecodeUUID = function (uuid) {
    const P1 = 8,
      P2 = 12,
      P3 = 16,
      P4 = 20;

    return [uuid.slice(0, P1), uuid.slice(P1, P2), uuid.slice(P2, P3), uuid.slice(P3, P4), uuid.slice(P4)].join("-");
  },
  getProfileForUUID = function (uuid) {
    const API_ENDPOINT = `${BASE_API_URL}/${uuid.replace(/-/g, "")}`;
    Log.debug(`Providing Axios promise for ${API_ENDPOINT}`, DOMAIN);
    return Axios.get(API_ENDPOINT);
  },
  jsonFromProfileResp = function (resp) {
    let fulljson = {
      id: resp.id,
      name: resp.name,
      properties: {},
    };
    if (resp.properties) {
      resp.properties.map((property) => {
        fulljson[property["name"]] = JSON.parse(Buffer.from(property["value"], "base64"));
      });
    }
    return fulljson;
  };

module.exports = {
  uriDecodeUUID,
  uriEncodeUUID,
  getProfileForUUID,
  jsonFromProfileResp,
};
