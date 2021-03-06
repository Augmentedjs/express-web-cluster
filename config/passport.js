// load all the things we need
const LocalStrategy = require("passport-local").Strategy;

// load up the user model
const User = require("../models/user.js");

module.exports = (passport) => {

  // =========================================================================
  // passport session setup ==================================================
  // =========================================================================
  // required for persistent login sessions
  // passport needs ability to serialize and unserialize users out of session

  // used to serialize the user for the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // used to deserialize the user
  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
  });

  // =========================================================================
  // LOCAL LOGIN =============================================================
  // =========================================================================
  passport.use("local-login", new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField : "email",
    passwordField : "password",
    passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
  },
  (req, email, password, done) => {
    if (email) {
      email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching
    }

    // asynchronous
    process.nextTick(() => {
      User.findOne({ "local.email" :  email }, (err, user) => {
        // if there are any errors, return the error
        if (err) {
          return done(err);
        }

        // if no user is found, return the message
        if (!user) {
          return done(null, false, req.flash("loginMessage", "No user found."));
        }

        if (!user.validPassword(password)) {
          return done(null, false, req.flash("loginMessage", "Oops! Wrong password."));
        // all is well, return user
        } else {
          //console.debug(user);
          req.login(user, (err) => {
            if (err) {
              return done(err);
            }
            return done(null, user, req.flash("loginMessage", "Successful login!"));
          });

        }
      });
    });
  }));

  // =========================================================================
  // LOCAL SIGNUP ============================================================
  // =========================================================================
  passport.use("local-signup", new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField : "email",
    passwordField : "password",
    passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
  },
  (req, email, password, done) => {
    if (email)
    email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

    // asynchronous
    process.nextTick(() => {
      // if the user is not already logged in:
      if (!req.user) {
        User.findOne({ "local.email" :  email }, (err, user) => {
          // if there are any errors, return the error
          if (err)
          return done(err);

          // check to see if there's already a user with that email
          if (user) {
            return done(null, false, req.flash("signupMessage", "That email is already taken."));
          } else {

            // create the user
            let newUser            = new User();

            newUser.local.email    = email;
            newUser.local.password = newUser.generateHash(password);
            //newUser.local.name = name;
            //newUser.local.avatar = avatar;

            newUser.save((err) => {
              if (err)
              return done(err);

              return done(null, newUser);
            });
          }

        });
        // if the user is logged in but has no local account...
      } else if ( !req.user.local.email ) {
        // ...presumably they"re trying to connect a local account
        // BUT let"s check if the email used to connect a local account is being used by another user
        User.findOne({ "local.email" :  email }, (err, user) => {
          if (err)
          return done(err);

          if (user) {
            return done(null, false, req.flash("loginMessage", "That email is already taken."));
            // Using "loginMessage instead of signupMessage because it"s used by /connect/local"
          } else {
            let user = req.user;
            user.local.email = email;
            user.local.password = user.generateHash(password);
            user.save( (err) => {
              if (err)
              return done(err);

              return done(null,user);
            });
          }
        });
      } else {
        // user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
        return done(null, req.user);
      }
    });
  }));
};
