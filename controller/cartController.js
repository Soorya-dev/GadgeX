const Cart = require("../model/cartModel");
const Category = require("../model/categoryModel");
const User = require("../model/userModel");
const Product = require("../model/productModel");
const Address = require("../model/addressModel");
const mongoose = require("mongoose");

const loadCart = async (req, res) => {
  try {
    const user = req.session.user_id;
    const cart = await Cart.findOne({ user }).populate('product.productId');

    if (!cart) {
      return res.render("user/cart", { user, products: [], subtotal: 0 });
    }

    const products = cart.product;
    const subtotal = products.reduce((acc, item) => acc + item.total, 0);

    res.render("user/cart", { user, products, subtotal });
  } catch (error) {
    console.error('Error loading cart:', error);
    res.status(500).send("Internal Server Error");
  }
};


const AddToCart = async (req, res) => {
  try {
    const userId = req.session.user_id;

    const { productId, quantity } = req.body;
    console.log('body:data', req.body);
    console.log('Session data:', userId);
    if (!userId) {
      console.log('User not found');
      return res.status(401).json({ message: "Unauthorized" });
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

    // Calculate and update the subtotal
    cart.subtotal = cart.product.reduce((total, item) => total + item.total, 0);

    // Save the cart
    await cart.save();
    res.status(200).json({ message: "Product added to cart", cart });
  } catch (err) {
    console.error('Error adding product to cart:', err);
    
    res.status(500).json({ message: "Internal server error" });
  }
};


const updateQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Number(quantity);
    const user = req.session.user_id;

    console.log(productId, "productId");
    console.log(user, "user");

    const cart = await Cart.findOne({ user });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    console.log('cart:', cart);

    const productIndex = cart.product.findIndex(item => {
      return item._id.toString() === productId;
    });

    console.log('productIndex:', productIndex);

    if (productIndex > -1) {
      // Update the quantity and total for the existing product
      cart.product[productIndex].quantity = qty;
      cart.product[productIndex].total = qty * cart.product[productIndex].price;
    } else {
      return res.status(404).json({ success: false, message: 'Product not found in cart' });
    }

    // Calculate the new subtotal
    const subtotal = cart.product.reduce((acc, item) => acc + item.total, 0);

    await cart.save();

    res.json({ success: true, cart, subtotal: subtotal.toFixed(2) });

  } catch (error) {
    console.error('Error updating quantity:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


module.exports = {
  loadCart,
  AddToCart,
  updateQuantity
}; 