const Zip = require("node-7z");
const ZipBin = require("7zip-bin");

const PATHS = require("./helpers/PathRefrence").paths;
const logger = require('./helpers/Logger').getLogger();
const DOMAIN = "JarDataExtractor";

const dataExtractionProgress = { fileCount: 0, percent: 0 };

/**
 * Extract the data information from the minecraft jar
 */
function extractDataFromJar() {
  Zip.extractFull(PATHS.MCJAR_FILE, PATHS.EXTRACTED_DIR, {
    $bin: ZipBin,
    $cherryPick: "data/minecraft/*",
    $progress: true,
  })

    .on("progress", function (data) {
      dataExtractionProgress.percent = data.percent;
      dataExtractionProgress.fileCount = data.fileCount;
    })

    // When all is done
    .on("end", function () {
      dataExtractionProgress.percent = 100;
      logger.verbose("Extracting done!", { domain: DOMAIN });
    })

    // On error
    .on("error", function (err) {
      logger.error(JSON.stringify(err), { domain: DOMAIN });
    });
}

module.exports = { dataExtractionProgress, extractDataFromJar };
