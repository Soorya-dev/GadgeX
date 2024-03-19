const express = require('express');
const route = express.Router();

const userController = require('../controller/userController');

route.get('/', userController.userHome);
route.get('/login', userController.userLoginPage);
route.post('/registration', userController.userRegistration);
route.post('/verify-otp',userController.verifyOtp);
route.get('/home',userController.userHome)

module.exports = route; 


