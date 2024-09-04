const User = require("../model/userModel");

const isUserLogin = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      const userData = await User.findById(req.session.user_id);
      if (userData && userData.isBlocked) {
        req.session.destroy((err) => {
          if (err) {
            console.error("Session destruction error:", err);
            return res.status(500).send("An error occurred while logging out.");
          }
          res.redirect("/login");
        });
      } else {
        res.locals.user = userData;
        next();
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

//----------------------
const isUserLogout = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      res.redirect("/home");
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = { isUserLogin, isUserLogout };
