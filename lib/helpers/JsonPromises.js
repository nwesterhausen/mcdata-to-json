/**
 * Promise version of JSON.stringify
 * @param {Object} obj
 * @return {Promise}
 */
function promiseStringify(obj) {
  return new Promise((resolve, reject) => {
    try {
      resolve(JSON.stringify(obj));
    } catch (err) {
      reject(err);
    }
  });
}
/**
 * Promise version of JSON.parse
 * @param {string} strObj
 * @return {Promise}
 */
function promiseParse(strObj) {
  return new Promise((resolve, reject) => {
    try {
      resolve(JSON.parse(strObj));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  promiseParse,
  promiseStringify,
};
