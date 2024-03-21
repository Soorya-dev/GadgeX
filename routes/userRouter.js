const express = require("express");
const route = express.Router();
const auth = require("../middlewears/userAuth");
const userController = require("../controller/userController");
const path = require("path");

route.use(express.static(path.join(__dirname, "..", "public", "uploads")));

route.get("/", userController.userHome);

route.get("/login", auth.isUserLogout, userController.userLoginPage);
route.post("/login", userController.userLogin);

route.post("/registration", userController.userRegistration);
route.post("/verify-otp", userController.verifyOtp);
route.get("/home", userController.userHome);
route.get("/shop", userController.viewProduct);
route.get("/singleProduct/:id", userController.singleProduct);

route.post("/reSendOtp", userController.resendOtp);

route.get("/logout", auth.isUserLogin, userController.loadLogout);
module.exports = route;
