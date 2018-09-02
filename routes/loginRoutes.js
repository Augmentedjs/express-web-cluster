module.exports = (app, passport) => {
  app.post("/logout", (req, res) => {
    req.logout();
    req.session = null;
    res.status(200).send({"message": "Successful Logoff."});
  });

  app.post("/login", passport.authenticate("local-login", { failWithError: true }), (req, res, next) => {
    // handle success
    req.session.user = req.user;
    return res.status(200).send(req.user);
  }, (err, req, res, next) => {
    // handle error
    return res.status(401).send(err);
  });

  app.post("/signup", passport.authenticate("local-signup", { failWithError: true }),
  (req, res, next) => {
    // handle success
    return res.status(201).send(req.user);
  },
  (err, req, res, next) => {
    // handle error
    return res.status(401).send(err);
  });
};
