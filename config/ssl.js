const fs = require("fs");
const logger = require("../logger.js");

let sslOptions;

try {
  sslOptions = {
    key: fs.readFileSync("../certs/key.pem"),
    cert: fs.readFileSync("../certs/cert.pem"),
    passphrase: "doctor"
  };
} catch (e) {
  logger.error(`Could not read SSL certs. ${e}`);
  sslOptions = null;
}

module.exports = sslOptions;
