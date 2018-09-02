const MongoClient = require("mongodb").MongoClient;
const CONSTANTS = require("../constants.js");

const database = {
  instance: null,
};

module.exports.connect = (done) => {
  if (database.instance) {
    return done();
  }
  MongoClient.connect(CONSTANTS.MONGO_DB_URI, (err, db) => {
    if (err) {
      return done(err);
    }
    database.instance = db;
    done();
  });
};

module.exports.get = () => {
  return database.instance;
};

module.exports.close = (done) => {
  if (database.instance) {
    database.instance.close((err, result) => {
      database.instance = null;
      database.mode = null;
      done(err);
    });
  }
};
