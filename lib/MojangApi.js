const Axios = require("axios");
const logger = require("./helpers/Logger").getLogger();

const BASE_API_URL = "https://sessionserver.mojang.com/session/minecraft/profile";
const DOMAIN = "MojangAPI Runner";

Axios.defaults.headers.get["Content-Type"] = "application/json";

const uriEncodeUUID = function (uuid) {
  return uuid.replace(/-/g, "");
};
const uriDecodeUUID = function (uuid) {
  const P1 = 8;
  const P2 = 12;
  const P3 = 16;
  const P4 = 20;

  return [uuid.slice(0, P1), uuid.slice(P1, P2), uuid.slice(P2, P3), uuid.slice(P3, P4), uuid.slice(P4)].join("-");
};
const getProfileForUUID = function (uuid) {
  const API_ENDPOINT = `${BASE_API_URL}/${uuid.replace(/-/g, "")}`;
  logger.debug(`Providing Axios promise for ${API_ENDPOINT}`, { domain: DOMAIN });
  return Axios.get(API_ENDPOINT);
};
const jsonFromProfileResp = function (resp) {
  const fulljson = {
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
  getProfileForUUID,
  jsonFromProfileResp,
  uriDecodeUUID,
  uriEncodeUUID,
};
