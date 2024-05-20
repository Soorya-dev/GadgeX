const Cart = require("../model/cartModel");
const Category = require("../model/categoryModel");
const User = require("../model/userModel");
const Product = require("../model/productModel");
const Address = require("../model/addressModel");
const mongoose = require("mongoose");

const loadCart = async (req, res) => {
  try {
    const user= req.session.user_id;
    const cart = await Cart.findOne({ user }).populate('product.productId')
    if (!cart) {
      return res.render("user/cart", { user, products: [] });
    }
console.log('cart.product:',cart.product);
res.render("user/cart", { user, products: cart.product });
    }
     catch (error) {
    console.log(error, "asdfgh");
    res.status(500).send("Internal Server Error");
  }
};

const AddToCart = async (req, res) => {
  try {
    const userId = req.session.user_id;

    const { productId, quantity } = req.body;
    console.log('body:data', req.body);
    console.log('Session data:', userId);
if(!userId){
  console.log('user not found');

}
    // Check if productId and quantity are provided and valid
    if (!productId || !quantity) {
      return res.status(400).json({ message: "Product ID and quantity are required" });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    // Find the product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Find the user's cart or create a new one
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, product: [] });
    }

    // Check if the product is already in the cart
    const productIndex = cart.product.findIndex(item => item.productId.toString() === productId);
    if (productIndex > -1) {
      // Product exists in the cart, update the quantity and total
      cart.product[productIndex].quantity += qty;
      cart.product[productIndex].total = cart.product[productIndex].quantity * cart.product[productIndex].price;
    } else {
      // Product does not exist in the cart, add it
      cart.product.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: qty,
        total: product.price * qty
      });
    }

    // Save the cart
    await cart.save();
    res.status(200).json({ message: "Product added to cart", cart });
  } catch (err) {
    console.error('Error adding product to cart:', err);
    res.status(500).json({ message: "Internal server error" });
  }
};




module.exports = {
  loadCart,
  AddToCart,
};