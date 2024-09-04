const Products = require("../model/productModel");
const User = require("../model/userModel");
const cartDB = require("../model/cartModel");
const Address = require("../model/addressModel");
const Product = require("../model/productModel");
const Order = require("../model/order");
const mongoose = require('mongoose');
const Coupon =require("../model/couponModel")
const Wallet =require("../model/walletModel")
const { fetchExchangeRate, generateRandomString } = require('../utils/orderHelper');
const { createPayPalPayment } = require('../middlewears/paymentServices');
const Offer=require('../model/offerModel')
const Category=require('../model/categoryModel')

const loadCheckout = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findOne({ _id: userId });
    const address = await Address.find({ user: userId });
    const cart = await cartDB.findOne({ user: userId }).populate('product.productId').lean();
    const coupon = await Coupon.find({});
    const categories = await Category.find();

    // Define isEmpty based on the cart
    const isEmpty = !cart || cart.product.length === 0;

    // Calculate subtotal if cart is not empty
    let subtotal = 0;
    if (!isEmpty) {
      cart.product.forEach(item => {
        const price = item.productId.offerApplied ? item.productId.offerDetails.priceAfterOfferApplied : item.productId.price;
        subtotal += price * item.quantity;
      });
    }

    res.render("./user/checkout", { 
      user, 
      address, 
      cartData: cart, 
      cart: cart ? cart.product : [], 
      coupon,
      subtotal,
      categories,
      isEmpty // Pass isEmpty to the view
    });
  } catch (error) {
    console.error("Error loading checkout:", error);
    res.status(500).send("Internal Server Error");
  }
};

const addAddressCheckout = async (req, res) => {
  console.log("addAddressCheckout function called");
  try {
      const userId = req.session.user_id;
      console.log("User ID from session:", userId);

      if (!userId) {
          console.log("User not authenticated");
          return res.status(400).json({ success: false, message: "User not authenticated" });
      }

      console.log("Received form data:", req.body);

      const {
          name,
          mobile,
          houseName,
          street,
          landmark,
          pincode,
          city,
          state,
      } = req.body;

      // Validate required fields
      if (!name || !mobile || !pincode || !city || !state) {
          console.log("Missing required fields");
          return res.status(400).json({ success: false, message: "All required fields must be filled" });
      }

      // Create a new address
      const newAddress = new Address({
          name,
          user: userId,
          mobile: Number(mobile),
          houseName,
          street,
          landmark,
          pincode: Number(pincode),
          city,
          state,
          default: false,
      });

      console.log("New address object:", newAddress);

      // Save the address
      await newAddress.save();
      console.log("Address saved successfully");

      res.status(201).json({ success: true, message: "Address added successfully for checkout" });
  } catch (error) {
      console.error("Error adding address during checkout:", error);
      res.status(500).json({ success: false, message: "An error occurred while adding the address" });
  }
};

const checkoutAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { addressId, paymentMethod } = req.body;
    const { cart } = req.body;

    const products = cart.map((item) => ({
      productId: item.productId,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      price: item.price,
    }));

    const newOrder = new Order({
      user: userId,
      paymentMethod: paymentMethod || 'COD',
      product: products,
      subtotal: calculateSubtotal(products),
      Date: new Date(),
      expiredate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      addressId: addressId,
      status: 'Pending',
      discount: 0,
    });

    await newOrder.save();

    res.render('./user/checkout', { orderId: newOrder._id });
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

function calculateSubtotal(products) {
  return products.reduce((total, product) => total + product.quantity * product.price, 0);
}




const saveOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) {
      console.error('User ID not found in session');
      return res.status(400).json({ error: 'User ID is not found in session' });
    }

    const { addressId, paymentMethod } = req.body;
    if (!addressId || !paymentMethod) {
      console.error('Missing Address ID or Payment Method');
      return res.status(400).json({ error: 'Address ID or Payment Method missing from request body' });
    }

    // Fetch the cart data
    const cartData = await cartDB.findOne({ user: userId }).populate("product.productId");
    if (!cartData || !cartData.product || cartData.product.length === 0) {
      console.error('Cart is empty or not found for the user');
      return res.status(400).json({ error: 'Cart is empty or not found for the user' });
    }

    // Use the subtotal from cartData, which should already include any discounts
    const subtotal = cartData.subtotal;
    const discount = cartData.discount || 0;
    const total = subtotal; // subtotal is already discounted

    let newOrder;

    // Handle different payment methods
    if (paymentMethod === 'Wallet') {
      let wallet = await Wallet.findOne({ user: userId });
      if (!wallet) {
        wallet = new Wallet({ user: userId, balance: 0 });
        await wallet.save();
      }

      if (wallet.balance < total) {
        console.error('Insufficient wallet balance');
        return res.status(400).json({ error: 'Insufficient wallet balance' });
      }

      wallet.balance -= total;
      wallet.transactions.push({ type: 'debit', amount: total, description: 'Order Payment' });
      await wallet.save();

      newOrder = new Order({
        user: userId,
        paymentMethod: paymentMethod,
        product: cartData.product,
        subtotal: subtotal,
        discount: discount,
        total: total,
        Date: new Date(),
        addressId: addressId,
        status: 'Pending',
      });

    } else if (paymentMethod === 'paypal') {
      newOrder = new Order({
        user: userId,
        paymentMethod: paymentMethod,
        product: cartData.product,
        subtotal: subtotal,
        discount: discount,
        total: total,
        Date: new Date(),
        addressId: addressId,
        status: 'Pending',
      });
    
      await newOrder.save();
      const approvalUrl = await createPayPalPayment(newOrder._id, userId);
      return res.status(200).json({ approvalUrl });
    
    } else if (paymentMethod === 'COD') {
      if (total > 1000) {
        console.error('COD not available for orders above Rs 1000');
        return res.status(400).json({ error: 'Cash on Delivery is not available for orders above Rs 1000' });
      }

      newOrder = new Order({
        user: userId,
        paymentMethod: paymentMethod,
        product: cartData.product,
        subtotal: subtotal,
        discount: discount,
        total: total,
        Date: new Date(),
        addressId: addressId,
        status: 'Pending',
      });

      // Update product stock for COD
      for (const item of cartData.product) {
        const product = await Product.findById(item.productId);
        if (!product) {
          console.error('Product not found:', item.productId);
          return res.status(400).json({ error: `Product not found: ${item.productId}` });
        }

        if (product.stock < item.quantity) {
          console.error('Insufficient stock for product:', product.name);
          return res.status(400).json({ error: `Insufficient stock for product ${product.name}` });
        }

        product.stock -= item.quantity;
        await product.save();
      }

    } else {
      console.error('Unsupported payment method:', paymentMethod);
      return res.status(400).json({ error: 'Unsupported payment method' });
    }

    await newOrder.save();

    // Clear the cart after order placement
    await cartDB.updateOne({ user: userId }, { $set: { product: [], subtotal: 0, discount: 0 } });

    return res.status(200).json({ order: newOrder._id });

  } catch (error) {
    console.error('Error saving order:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};






const getUserOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const orders = await Order.find({ user: userId }).populate('product.productId');

    res.render('./user/orders', { orders });
  } catch (error) {
    console.error("Error getting user orders:", error);
    res.status(500).send("Internal Server Error");
  }
};

const orderSuccess = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId)
      .populate('user')
      .populate('product.productId')
      .populate('addressId');
    
    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Fetch the latest cart data to get the coupon discount
    const cartData = await cartDB.findOne({ user: order.user });
    
    // Calculate the total including the coupon discount
    const couponDiscount = cartData ? (cartData.couponDiscount || 0) : 0;
    const total = order.subtotal 

    // Update the order with the coupon discount and total
    order.couponDiscount = couponDiscount;
    order.total = total;
    await order.save();

    await cartDB.deleteOne({ user: req.session.user_id });
    
    res.render('./user/SuccessPage', { 
      order: {
        ...order.toObject(),
        couponDiscount,
        total
      } 
    });
  } catch (error) {
    console.error("Error loading checkout:", error);
    res.status(500).send("Internal Server Error");
  }
};
const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    // Find the order and update its status
    const order = await Order.findByIdAndUpdate(orderId, { status: 'Cancelled' }, { new: true });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Handle refund based on payment method
    if (order.paymentMethod === 'Wallet' || order.paymentMethod === 'paypal') {
      let wallet = await Wallet.findOne({ user: order.user });
      
      if (!wallet) {
        // Create wallet if it doesn't exist
        wallet = new Wallet({ user: order.user, balance: 0 });
      }

      // Add the refund to the wallet
      wallet.balance += order.subtotal;
      wallet.transactions.push({
        type: 'credit',
        amount: order.subtotal,
        description: `Refund for cancelled order ${order._id}`
      });
      await wallet.save();

      if (order.paymentMethod === 'paypal') {
        // Log the PayPal refund (you might want to implement actual PayPal refund here)
        console.log(`PayPal refund of ${order.subtotal} added to wallet for order ${order._id}`);
      }
    }

    // Restore product stock
    for (const item of order.product) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
    }

    res.json({ success: true, message: 'Order cancelled and refunded successfully' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ success: false, message: 'Error cancelling order' });
  }
};
const returnOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
console.log(orderId,"rgdsdhsdhhsrthsthsths");

    const order = await Order.findByIdAndUpdate(orderId, 
      { returnStatus: 'Pending' }, 
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, message: 'Return request submitted successfully' });
  } catch (error) {
    console.error('Error submitting return request:', error);
    res.status(500).json({ success: false, message: 'An error occurred while submitting the return request' });
  }
};

const paymentSuccess = async (req, res) => {
  try {
    const { paymentId, token, PayerID } = req.query;

    const payment = await executePayPalPayment(paymentId, PayerID);

    const order = await Order.findOne({ 'payment.paymentId': paymentId });

    if (!order) {
      return res.status(404).render('./user/paymentCancelled', { message: 'Order not found' });
    }

    if (payment.state === 'approved') {
      // Update order payment status to 'Completed' and order status to 'Processing'
      order.paymentStatus = 'Completed';
      order.status = 'pending';  // Change to 'Processing' or any other appropriate status
      order.payment = {
        paymentId: paymentId,
        payerID: PayerID,
        paymentToken: token,
        amount: payment.transactions[0].amount.total,
      };
      await order.save();

      console.log('Updated order:', order);  // Log the updated order for debugging

      // Clear cart
      await cartDB.deleteOne({ user: req.session.user_id });

      res.render('./user/SuccessPage', { order });
    } else {
      // Payment failed
      order.status = 'Payment Failed';
      order.paymentStatus = 'Failed';
      await order.save();
      res.render('./user/paymentFailed', { orderId: order._id, message: 'Payment failed. Please try again.' });
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).render('./user/paymentFailed', { message: 'Payment processing error' });
  }
};


const paymentCancelled = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // Update order status to 'Payment Pending'
    const order = await Order.findByIdAndUpdate(
      orderId, 
      { 
        status: 'Payment Pending',
        paymentStatus: 'Pending'
      },
      { new: true }
    ).populate('product.productId');

    if (!order) {
      throw new Error('Order not found');
    }

    res.render('./user/paymentCancelled', { 
      order, 
      message: 'Payment was cancelled. You can try again later.' 
    });
  } catch (error) {
    console.error('Error handling payment cancellation:', error.message);
    res.status(500).send('An error occurred while processing your request.');
  }
};
const continuePayment = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.paymentStatus !== 'Pending' && order.paymentStatus !== 'Failed') {
      return res.status(400).json({ error: 'Payment cannot be continued for this order' });
    }

    // Create a new PayPal payment for the existing order
    const approvalUrl = await createPayPalPayment(orderId, order.user);

    // Update the order status to indicate payment is in progress
    order.paymentStatus = 'Pending';
    order.status = 'Pending';
    await order.save();

    res.json({ approvalUrl });
  } catch (error) {
    console.error('Error continuing payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



// Helper function to execute PayPal payment
const executePayPalPayment = (paymentId, PayerID) => {
  return new Promise((resolve, reject) => {
    paypal.payment.execute(paymentId, { payer_id: PayerID }, (error, payment) => {
      if (error) {
        console.error('Error executing PayPal payment:', error);
        reject(error);
      } else {
        console.log('Executed PayPal Payment:', payment);
        resolve(payment);
      }
    });
  });
};



module.exports = {
  loadCheckout,
  checkoutAddress,
  saveOrder,
  orderSuccess,
  getUserOrder,
  cancelOrder,
  returnOrder,
  paymentSuccess,
  paymentCancelled,
  addAddressCheckout,
  continuePayment

};

















































