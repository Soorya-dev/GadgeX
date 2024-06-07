const express = require("express");
const route = express.Router();
const auth = require("../middlewears/userAuth");
const userController = require("../controller/userController");
const cartController = require("../controller/cartController");
const path = require("path");
const orderController = require("../controller/orderController");
route.use(express.static(path.join(__dirname, "..", "public", "uploads")));

// route.get("/", userController.userHome);

route.get("/login", auth.isUserLogout, userController.userLoginPage);
route.post("/login", userController.userLogin);

route.get("/register", userController.loadRegistration);
route.post("/register", userController.userRegistration);
route.get("/", userController.userHome);
route.get("/home", userController.userHome);


route.get("/otpPage/:userId",userController.otpPage)
route.post("/verify-otp", userController.verifyOtp);
route.post("/reSendOtp", userController.resendOtp);


route.get('/forgotPassword', userController.ForgotPassword);
route.post('/forgotPassword', userController.ForgotPassword);
route.get('/reset/:token', userController.resetPassword);
route.post('/reset/:token', userController.resetPassword);


route.get("/shop", userController.viewProduct);
route.get("/singleProduct/:id", userController.singleProduct);



route.get("/logout", auth.isUserLogin, userController.loadLogout);

//Cart route

route.get('/cart',  cartController.loadCart); 
route.post('/cart', cartController.AddToCart);
route.post('/updateQuantity',cartController.updateQuantity);
// route.post("/updatecart", cartController.UpdateCart);
// route.delete("/removecart",  cartController.removeCart);

//user profile route
route.get('/userProfile',  userController.loadUserProfile);
route.post('/addAddress',userController.addAddress)
route.get('/addAddress',userController.addAddress)

// checkout
route.get('/checkout',orderController.loadCheckout)
route.post('/checkoutAddress',orderController.checkoutAddress)
route.post('/saveOrder', orderController.saveOrder);

route.get('/Successpage',orderController.orderSuccess)


module.exports = route;
