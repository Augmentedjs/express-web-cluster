// Web Service
const port = 3000;
const sslPort = 8443;
const localSSLURI = `https://localhost:${sslPort}`;
const SSLURI = `https://x.x.x.x:${sslPort}`;
const webServiceURI = `http://x.x.x.x:${port}`;
const localWebServiceURI = `http://localhost:${port}`;

module.exports.MONGO_DB_URI = "mongodb://express:something";

module.exports.SSLPORT = sslPort;
module.exports.ALLOWED_ORIGINS = [localSSLURI, SSLURI, webServiceURI, localWebServiceURI];

module.exports.ABOUT = "Clustered Express Service";

module.exports.PORT = port;
