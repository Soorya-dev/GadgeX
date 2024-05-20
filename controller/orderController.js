
const Products = require("../model/productModel");
const User = require("../model/userModel");
const cartDB=require('../model/cartModel')


const loadCheckout=async(req,res)=>{
    try {
      const userId = req.session.user_id;
      const user = await User.findOne({ _id: userId });
      const cartData=await 
      res.render('./user/checkout', { user })
    } catch (error) {
      console.log(error);
    }
  }



  module.exports = {

    loadCheckout
    
  };