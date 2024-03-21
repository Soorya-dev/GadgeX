const userModel = require("../model/userModel");

const isUserLogin = async (req, res, next) => {
  try {
    if (req.session.user_id) {
  res.locals.user = req.session.user_id
  const user = res.locals.user
      next();
   
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
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
    console.log(error.message);
  }
};

module.exports = { isUserLogin, isUserLogout };
