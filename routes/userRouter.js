const express=require('express')
const route=express.Router()
const userController=require('../controller/userController')

route.get('/',userController.userHome)
route.get("/login",userController.userLogin)
route.post("/registration",userController.userRegistration)















module.exports=route;