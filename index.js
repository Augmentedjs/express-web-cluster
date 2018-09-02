const cluster = require("cluster");
const http = require("http");
const https = require("https");
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const compression = require("compression");
const mongoose = require("mongoose");
const passport = require("passport");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const database = require("./config/db.js");
const logger = require("./logger.js");
const CONSTANTS = require("./constants.js");
const sslOptions = require("./config/ssl.js");
const shouldCompress = (req, res) => {
  if (req.headers["x-no-compression"]) {
    // don't compress responses with this request header
    return false;
  }
  // fallback to standard filter function
  return compression.filter(req, res);
};

// the master process
if (cluster.isMaster) {
  // Count the CPUs
  const cpuCount = require("os").cpus().length;
  let i = 0;

  // Create a worker for each CPU
  for (i = 0; i < cpuCount; i += 1) {
    cluster.fork();
  }

  // Listen for dying workers
  cluster.on("exit", (worker) => {
    // Replace the dead worker
    logger.warn(`Worker ${worker.id} died, restarting...`);
    cluster.fork();
  });
} else {
  const app = express();

  app.use(compression({filter: shouldCompress}));
  app.use(bodyParser.json()); // support json encoded bodies

  // configuration ===============================================================
  mongoose.connect(CONSTANTS.MONGO_DB_URI, {
    useMongoClient: true,
    connectTimeoutMS: 1000
  }); // connect to our database

  require("./config/passport")(passport); // pass passport for configuration

  // set up our express application
  app.use(cookieParser()); // read cookies (needed for auth)
  app.use(bodyParser.json()); // get information from html forms
  app.use(bodyParser.urlencoded({ extended: true }));

  //app.set("view engine", "ejs"); // set up ejs for templating

  // required for passport
  app.use(session({
      secret: "doctor", // session secret
      resave: true,
      saveUninitialized: true
  }));
  app.use(passport.initialize());
  app.use(passport.session()); // persistent login sessions
  app.use(flash()); // use connect-flash for flash messages stored in session
  app.use((req, res, next) => {
    logger.debug("session ", req.session);
    res.locals.user = req.user || null;
    next();
  });


  // For CORS
  app.use( (req, res, next) => {
    // Website you wish to allow to connect
    const origin = req.headers.origin;
    if (CONSTANTS.ALLOWED_ORIGINS.indexOf(origin) > -1) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    // Request methods you wish to allow
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    // Request headers you wish to allow
    res.setHeader("Access-Control-Allow-Headers", "Authorization,X-Requested-With,content-type,access-control-allow-headers,access-control-allow-methods,access-control-allow-origin");
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader("Access-Control-Allow-Credentials", true);
    // Pass to next layer of middleware
    next();
  });

  //Global Vars
  app.use( (req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
  });

  app.use("/", express.static(path.join(__dirname, "/../dist")));
  app.use("/vendor", express.static(path.join(__dirname, "/../node_modules")));

  // routes ======================================================================
  require("./routes/loginRoutes.js")(app, passport);

  app.get("/about", (req, res) => {
    res.status(200).send(CONSTANTS.ABOUT);
  });

  if (sslOptions) {
    https.createServer(sslOptions, app).listen(process.env.PORT || CONSTANTS.SSLPORT);
    logger.info(`Cluster node ${cluster.worker.id} "${CONSTANTS.ABOUT}" listening at port ${CONSTANTS.SSLPORT}`);
  } else {
    logger.error(`No certs to start an https service!`);
    app.listen(CONSTANTS.PORT, () => {

      logger.info(`Cluster node ${cluster.worker.id} "${CONSTANTS.ABOUT}" listening at port ${CONSTANTS.PORT}`);
    });
  }
  database.connect((err) => {
    if (err) {
      logger.error("Unable to connect to Mongo.");
    } else {
      logger.info("I Have a database connection!");
    }
  });
  //end cluster worker
};
