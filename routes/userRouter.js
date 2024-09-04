const express = require("express");
const route = express.Router();
const auth = require("../middlewears/userAuth");
const userController = require("../controller/userController");
const wishlistController = require("../controller/wishlistController");
const cartController = require("../controller/cartController");
const couponController = require("../controller/couponController");

const path = require("path");
const orderController = require("../controller/orderController");
route.use(express.static(path.join(__dirname, "..", "public", "uploads")));

// route.get("/", userController.userHome);

route.get("/login", auth.isUserLogout, userController.userLoginPage);
route.post("/login", userController.userLogin);
// Sign Out route
route.get("/signOut", auth.isUserLogin, userController.signOut);

route.get("/register", userController.loadRegistration);
route.post("/register", userController.userRegistration);
route.get("/", userController.userHome);
route.get("/home", userController.userHome);

route.get("/otpPage/:userId", userController.otpPage);
route.post("/verify-otp", userController.verifyOtp);
route.post("/reSendOtp", userController.resendOtp);

route.get("/forgotPassword", userController.getForgotPassword);
route.post("/forgotPassword", userController.forgotPassword);
route.get("/reset/:token", userController.getResetPassword);
route.post("/reset/:token", userController.resetPassword);

route.post("/changePassword", userController.changePassword); 


route.get("/shop", userController.viewProduct);
route.get("/filter-products", userController.filterProducts);
route.get("/singleProduct/:id", userController.singleProduct);

route.get("/logout", auth.isUserLogin, userController.loadLogout);

//Cart route

route.get("/cart", auth.isUserLogin,cartController.loadCart);
route.post("/cart", cartController.AddToCart);
route.post("/updateQuantity", cartController.updateQuantity);
route.post("/removeCart", cartController.removeCart);

//user profile route
route.get("/userProfile", auth.isUserLogin,userController.loadUserProfile);
route.get("/orderTracking", auth.isUserLogin,userController.loadOrderTracking);
route.get('/downloadInvoice/:orderId', auth.isUserLogin, userController.downloadInvoice);
route.post("/addAddress", userController.addAddress);
route.get("/addAddress", userController.addAddress);
route.post("/editAddress", userController.editAddress);
route.delete("/deleteAddress", userController.deleteAddress);

// checkout
route.get("/checkout", auth.isUserLogin,orderController.loadCheckout);
route.post("/checkoutAddress", orderController.checkoutAddress);
route.post('/addAddressCheckout', orderController.addAddressCheckout);
route.get("/getUserOrder", orderController.getUserOrder);
route.get("/Successpage/:id", auth.isUserLogin, orderController.orderSuccess);

route.post("/saveOrder", orderController.saveOrder);
route.get('/paymentSuccess', orderController.paymentSuccess);
route.get('/paymentCancelled/:orderId', orderController.paymentCancelled);
route.post("/continue-payment/:id", auth.isUserLogin, orderController.continuePayment)



route.post('/cancelOrder/:id', orderController.cancelOrder);
route.post('/return-order/:id', auth.isUserLogin, orderController.returnOrder);


//wishlist
route.post("/addWishlist", auth.isUserLogin,wishlistController.addToWishlist);
route.post("/removeWishlist", wishlistController.removeFromWishlist);
route.get("/wishlist", wishlistController.loadWishlist);

//404 error
route.get("/errorPage", userController.loadErrorPage);

route.post("/filter_category", userController.postFilterProduct);
//coupon
route.post("/applyCoupon", couponController.applyCoupon);
route.post("/removeCoupon", couponController.removeCoupon);

//load about
route.get("/about", userController.loadAbout);

module.exports = route;
