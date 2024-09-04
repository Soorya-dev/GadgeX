

const paypal = require('paypal-rest-sdk');
const cartDB = require('../model/cartModel'); // Adjust the path as needed
const Order = require("../model/order");
require("dotenv").config();

// Configure PayPal
paypal.configure({
  'mode': 'sandbox', // Change to 'live' for production
  'client_id': process.env.PAYPAL_CLIENT_ID,
  'client_secret': process.env.PAYPAL_CLIENT_SECRET
});

const createPayPalPayment = async (orderId, userId) => {
    try {
      const order = await Order.findById(orderId).populate('product.productId');
  
      if (!order) {
        throw new Error('Order not found');
      }
  
      // Prepare the items for PayPal
      const items = order.product.map(item => ({
        "name": item.productId.name,
        "price": (item.productId.offerApplied ? item.productId.offerDetails.priceAfterOfferApplied : item.productId.price).toFixed(2),
        "currency": "USD",
        "quantity": item.quantity
      }));
  
      // Calculate subtotal
      const subtotal = order.subtotal.toFixed(2);
  
      // Apply discount
      const discount = order.discount || 0;
      const total = (parseFloat(subtotal) - parseFloat(discount)).toFixed(2);
  
      // Prepare the create_payment_json with dynamic values
      const create_payment_json = {
        "intent": "sale",
        "payer": {
          "payment_method": "paypal"
        },
        "redirect_urls": {
  "return_url": `http://sooryadevanikkat.online/Successpage/${orderId}`,
  "cancel_url": `http://sooryadevanikkat.online/paymentCancelled/${orderId}`


        },
        "transactions": [{
          "item_list": {
            "items": items
          },
          "amount": {
            "currency": "USD",
            "total": total,
            "details": {
              "subtotal": subtotal,
              "discount": discount.toFixed(2)
            }
          },
          "description": "Order payment description."
        }]
      };
  
      // Create the payment with PayPal
      return new Promise((resolve, reject) => {
        paypal.payment.create(create_payment_json, (error, payment) => {
          if (error) {
            console.error('PayPal Error:', JSON.stringify(error.response, null, 2));
            reject(error);
          } else {
            const approvalUrl = payment.links.find(link => link.rel === 'approval_url').href;
            resolve(approvalUrl);
          }
        });
      });
    } catch (error) {
      console.error('Error creating PayPal payment:', error.message);
      throw error;
    }
  };

module.exports = {
    createPayPalPayment
};
