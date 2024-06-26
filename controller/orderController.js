const Products = require("../model/productModel");
const User = require("../model/userModel");
const cartDB = require("../model/cartModel");
const Address = require("../model/addressModel");
const Product = require("../model/productModel");
const Order = require("../model/order");
const mongoose = require('mongoose');


const loadCheckout = async (req, res) => {
  try {
    // const userId = req.session.user_id;
    const userId = "6645980ce3ebbba4ec9b98ba"
    const user = await User.findOne({ _id: userId });
    const address = await Address.find({ user: userId });
    const cart = await cartDB
      .findOne({ user: userId })
      .populate("product.productId");

    if (!cart) {
      return res.render("./user/checkout", {
        user,
        address,
        cart: [],
        subtotal: 0,
      }); 
    }

    const subtotal = cart.product.reduce((sum, item) => sum + item.total, 0);

    res.render("./user/checkout", {
      user,
      address,
      cart: cart.product,
      subtotal,
    });
  } catch (error) {
    console.error("Error loading checkout:", error);
    res.status(500).send("Internal Server Error");
  }
};

const checkoutAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { addressId, paymentMethod } = req.body;

    // Assuming you have the cart data available in req.body.cart
    const { cart } = req.body;

    // Prepare products array for the order
    const products = cart.map((item) => ({
      productId: item.productId,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      price: item.price,
    }));

    // Create new order object
    const newOrder = new Order({
      user: userId,
      paymentMethod: paymentMethod || 'COD', // Default payment method is COD
      product: products,
      subtotal: calculateSubtotal(products), // Calculate subtotal based on products
      Date: new Date(),
      expiredate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Set expiration date
      addressId: addressId,
      status: 'Pending', // Initial status of the order
      discount: 0, // Default discount
    });

    // Save the order to the database
    await newOrder.save();

    // Respond with success message
    // res.status(201).json({ message: 'Order placed successfully', orderId: newOrder._id });
    res.render('./user/checkout',{orderId: newOrder._id})
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// Function to calculate subtotal based on products
function calculateSubtotal(products) {
  return products.reduce((total, product) => total + product.quantity * product.price, 0);
}





const saveOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is not found in session' });
    }

    const { addressId, paymentMethod } = req.body;
    if (!addressId || !paymentMethod) {
      return res.status(400).json({ error: 'Address ID or Payment Method missing from request body' });
    }

    const cartData = await cartDB.findOne({ user: userId });
    if (!cartData) {
      return res.status(400).json({ error: 'Cart not found for the user' });
    }

    const products = cartData.product;
    if (!products || products.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const subtotal = products.reduce((sum, item) => sum + item.total, 0);

    const newOrder = new Order({
      user: userId,
      paymentMethod: paymentMethod || "COD",
      product: products,
      subtotal: subtotal,
      Date: new Date(),
      addressId: addressId,
      status: "Pending",
      discount: 0,
    });

    await newOrder.save();

    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.productId}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for product ${product.name}` });
      }

      product.stock -= item.quantity;
      await product.save();
    }

    await cartDB.updateOne({ user: userId }, { $set: { product: [] } });

    res.render('./user/SuccessPage', {
      order: newOrder
    });
  } catch (error) {
    console.error("Error saving order:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


// Get User Orders Function
const getUserOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const orders = await Order.find({ user: userId }).populate('product.productId');

    res.render('./user/orders', {
      orders
    });
  } catch (error) {
    console.error("Error getting user orders:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Order Success Function
const orderSuccess = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findOne({ _id: userId });
    const address = await Address.find({ user: userId });

    console.log(userId, "user console");
    res.render('./user/SuccessPage');
  } catch (error) {
    console.error("Error loading checkout:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  loadCheckout,
  checkoutAddress,
  saveOrder,
  orderSuccess,
  getUserOrder
};




















































// const saveOrder = async (req, res) => {
//   try {
//     const userId = req.session.user_id;
//     const { addressId, paymentMethod } = req.body;

//     // Retrieve cart data for the user
//     const cartData = await cartDB.findOne({ user: userId });

//     if (!cartData) {
//       return res.status(400).json({ error: "Cart not found" });
//     }

   
// const products=cartData.product
// console.log('cartData:',cartData);
// console.log('products:',products);
//     // Create new order object
//     const newOrder = new Order({
//       user: userId,
//       paymentMethod: paymentMethod || "COD",
//       product: products,
//       subtotal: cartData.subtotal,
//       Date: new Date(),

//       addressId: addressId,
//       status: "Pending", // You can set the initial status here
//       discount: 0, // You can set the discount if applicable
//     });

//     // Save the order to the database
//     await newOrder.save();

//     // Clear the user's cart
//     await cartDB.updateOne({ user: userId }, { $set: { product: [] } });

//     // res.render('./user/SuccessPage',{orderId: newOrder._id})
//     res.status(201).json("Order placed successfully");
//   } catch (error) {
//     console.error("Error saving order:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// const orderSuccess = async (req, res) => {
//   try {
//     const userId = req.session.user_id;
//     res.render('./user/SuccessPage')
//   } catch (error) {
//     console.error("Error loading checkout:", error);
//     res.status(500).send("Internal Server Error");
//   }
// };