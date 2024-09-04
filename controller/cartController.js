const Cart = require("../model/cartModel");
const Category = require("../model/categoryModel");
const User = require("../model/userModel");
const Product = require("../model/productModel");
const Address = require("../model/addressModel");
const mongoose = require("mongoose");
const Offer=require("../model/offerModel")
const loadCart = async (req, res) => {
  try {
    
    const user = req.session.user_id;
    const cart = await Cart.findOne({ user }).populate('product.productId');

    if (!cart || cart.product.length === 0) {
      return res.render("user/cart", { user, products: [], subtotal: 0, isEmpty: true });
    }

    const products = cart.product;

    const populatedCart = await cart.populate('product.productId');
    
    // Calculate and update the subtotal
    // cart.subtotal = populatedCart.product.reduce((total, item) => total + item.quantity * item.productId.price , 0);

    const subtotal = cart.subtotal
    const categories = await Category.find();

    // Fetch the user's cart
    

    res.render("user/cart", { user, products, subtotal, isEmpty: false ,categories,cart});
  } catch (error) {
    console.error('Error loading cart:', error);
    res.status(500).send("Internal Server Error");
  }
};


const AddToCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { productId, quantity } = req.body;

    if (!userId) {
      console.log('User not found');
      return res.status(401).json({ message: "Please login to add items to your cart" });
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

    // Check if product exists and is listed
    if (!product || !product.isListed) {
      return res.status(404).json({ message: "Product not found or is unlisted" });
    }

    // Find the user's cart or create a new one
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, product: [] });
    }

    // Check if the product is already in the cart
    const productIndex = cart.product.findIndex(item => item.productId.toString() === productId);
    let message;
    if (productIndex > -1) {
      // Product exists in the cart, update the quantity and total
      cart.product[productIndex].quantity += qty;
      message = "Product quantity updated in cart";
    } else {
      // Product does not exist in the cart, add it
      cart.product.push({
        productId: product._id,
        quantity: qty,
      });
      message = "Product added to cart";
    }

    console.log(await cart.populate('product.productId'), "holuuuuu");

    const populatedCart = await cart.populate('product.productId');
    if (product.offerApplied) {
      const offer = await Offer.findById(product.offerDetails.offerId);
      if (!offer || offer.expireDate < new Date()) {
        product.offerApplied = false;
        product.offerDetails = undefined;
        await product.save();
      }
    }

    // Calculate and update the subtotal
    cart.subtotal = populatedCart.product.reduce((total, item) => 
      total + item.quantity * (item.productId.offerApplied ? item.productId.offerDetails.priceAfterOfferApplied : item.productId.price)
    , 0);
    console.log(cart.subtotal, "moneyyyyyyyyyyyy");

    // Save the cart
    await cart.save();
    res.status(200).json({ success: true, message: message });
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

    

    const cart = await Cart.findOne({ user });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

  
    const productIndex = cart.product.findIndex(item => {
      return item._id.toString() === productId;
    });

    if (productIndex > -1) {
      // Update the quantity and total for the existing product
      cart.product[productIndex].quantity = qty;
      cart.product[productIndex].total = qty * cart.product[productIndex].price;
    } else {
      return res.status(404).json({ success: false, message: 'Product not found in cart' });
    }

    const populatedCart = await cart.populate('product.productId');
    
    // Calculate and update the subtotal
    // cart.subtotal = populatedCart.product.reduce((total, item) => total + item.quantity * item.productId.price , 0);

    // Calculate the new subtotal
    const subtotal= populatedCart.product.reduce((total, item) => total + item.quantity * (item.productId.offerApplied ? item.productId.offerDetails.priceAfterOfferApplied :  item.productId.price) , 0);

    cart.subtotal = subtotal;
    await cart.save();

    res.json({ success: true, cart, subtotal: subtotal.toFixed(2) });

  } catch (error) {
    console.error('Error updating quantity:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const removeCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { productId } = req.body;
    

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let cart = await Cart.findOne({ user: userId }).populate('product.productId');;
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const productIndex = cart.product.findIndex(item => item._id.toString() === productId);
  
    if (productIndex > -1) {
      cart.product.splice(productIndex, 1);
      cart.subtotal = cart.product.reduce((total, item) => total + item.productId.price*item.quantity, 0);
      console.log(cart.subtotal,"hhcfghcfhft");
      
      await cart.save();
      return res.status(200).json({ success: true, message: "Product removed from cart", cart });
    } else {
      return res.status(404).json({ success: false, message: "Product not found in cart" });
    }
  } catch (error) {
    console.error('Error removing product from cart:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  loadCart,
  AddToCart,
  updateQuantity,
  removeCart
};
