const otpDb = require("../model/otpModel");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const Products = require("../model/productModel");
const User = require("../model/userModel");
const Order = require("../model/order");
const Address = require("../model/addressModel");
const Category = require("../model/categoryModel");
const crypto = require("crypto");
const productModel = require("../model/productModel");
const categoryModel = require("../model/categoryModel");
const Wallet=require('../model/walletModel')
const PDFDocument = require('pdfkit');
const fs = require('fs');
const Offer=require('../model/offerModel')
const Coupon =require("../model/couponModel")
const Cart=require('../model/cartModel')

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error);
  }
};

const userHome = async (req, res) => {
  try {
    const userId = req.session.user_id;

    // Fetch user data
    const user = await User.findById(userId).lean();

    // Fetch cart data
    const cart = await Cart.findOne({ user: userId }).populate('product.productId').lean();

    // Check if cart is empty or not
    const isCartEmpty = !cart || cart.product.length === 0;

    // Calculate subtotal if cart is not empty
    const subtotal = isCartEmpty ? 0 : cart.product.reduce((total, item) => total + item.quantity * (item.productId.offerApplied ? item.productId.offerDetails.priceAfterOfferApplied : item.productId.price), 0);

    // Fetch featured products
    const featuredProducts = await Products.find({ isListed: true })
      .populate('category')
      .sort({ popularity: -1 })
      .limit(4)
      .lean();

    // Fetch new arrivals
    const newArrivals = await Products.find({ isListed: true })
      .populate('category')
      .sort({ createdAt: -1 })
      .limit(4)

      console.log('iam new arrivals',newArrivals)

    // Fetch deal of the day
    const dealOfTheDay = await Products.findOne({ isListed: true, isDealOfTheDay: true })
      .populate('category')
      .lean();

    // Fetch hot deals
    const hotDeals = await Products.find({ isListed: true, offerApplied: true })
      .populate('category')
      .sort({ 'offerDetails.offerPercentage': -1 })
      .limit(6)
      .lean();

    // Fetch top selling products
    const topSellingProducts = await Order.aggregate([
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.productId',
          totalQuantity: { $sum: '$product.quantity' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 4 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $project: {
          _id: '$productDetails._id',
          name: '$productDetails.name',
          image: '$productDetails.image',
          price: '$productDetails.price',
          category: '$productDetails.category',
          offerApplied: '$productDetails.offerApplied',
          offerDetails: '$productDetails.offerDetails',
          totalQuantity: 1
        }
      }
    ]);

    // Populate the category for each top selling product
    await Products.populate(topSellingProducts, { path: 'category' });

    // Fetch all categories dynamically
    const categories = await Category.find({ isListed: true }).lean();

    // Count the number of products in each category
    const categoryData = await Promise.all(categories.map(async (category) => {
      const count = await Products.countDocuments({
        category: category._id,
        isListed: true,
      });

      return {
        name: category.name,
        icon: category.icon, // Ensure you have an icon field in your Category model, or handle it differently.
        count: count,
      };
    }));

    // Fetch active coupons
    const activeCoupons = await Coupon.find({ 
      expired: { $gt: new Date() },
      'usersList.userId': { $ne: userId }
    }).limit(3).lean();

    // Fetch recent orders for the user
    const recentOrders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('product.productId')
      .lean();

      res.render("./user/homeTemplate", { 
        user, 
        cart,
        products: cart ? cart.product : [],
        subtotal,
        isEmpty: isCartEmpty,
        featuredProducts, 
        newArrivals,
        dealOfTheDay, 
        topSellingProducts,
        categories: categoryData,
        activeCoupons,
        recentOrders,
        hotDeals,
        currentCategory: '' // Add this line
      });
  } catch (error) {
    console.error('Error in userHome controller:', error);
    res.status(500).render('errorPage', { message: 'An error occurred while loading the home page. Please try again later.' });
  }
};


// const userLogin = async (req, res) => {

//   try {
//     res.render("user/login");
//   } catch (error) {
//     console.log(error);
//   }
// };

const loadRegistration = async (req, res) => {
  try {
    const categories = await Category.find({ isListed: true }).lean();
    const categoryData = await Promise.all(categories.map(async (category) => {
      const count = await Products.countDocuments({
        category: category._id,
        isListed: true,
      });

      return {
        name: category.name,
        icon: category.icon, // Ensure you have an icon field in your Category model, or handle it differently.
        count: count,
      };
    }));

    const cart = await Cart.findOne({ user: req.session.user_id }).populate('product.productId');
    const isEmpty = !cart || cart.product.length === 0;
    const products = cart ? cart.product : [];

    res.render("./user/register", { 
      user: "hello", 
      message: "", 
      categories: categoryData, 
      isEmpty, 
      products 
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
};


const otpRender = async (req, res) => {
  res.render("./user/otpVerification");
};

const otpPage = async (req, res) => {
  const userId = req.params.userId;
  res.render("./user/otpVerification", {
    userId,
  });
};

const userRegistration = async (req, res) => {
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    console.log("Generated ", otp);

    const userExist = await User.findOne({ email: req.body.email });
    if (userExist) {
      return res.render("user/login", { message: "User already exists" });
    }

    const spassword = await securePassword(req.body.password);

    const user = new User({
      name: req.body.username,
      email: req.body.email,
      mobile: req.body.phonenumber,
      password: spassword,
      is_admin: 0,
    });

    const userData = await user.save();

    if (userData) {
      const userOtp = new otpDb({
        otp: otp,
        userId: userData._id,
      });
      await userOtp.save();

      await sendOtp(req.body.email, otp);

      return res.json({ success: true, userId: userData._id });
    } else {
      return res.render("./user/login", {
        message: "Your registration has failed",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("An error occurred during registration.");
  }
};

// Function to send OTP via email
const sendOtp = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your email",
      html: `<div>Your OTP: ${otp}</div>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error occurred while sending email:", error);
  }
};

const resendOtp = async (req, res) => {
  try {
    const { userId } = req.body;

    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    const userData = await User.findOne({ _id: userId });
    const { email } = userData;

    const info = sendOtp(email, otp);
    if (info) {
      return res.json({ success: true });
    } else {
      return res.json({ success: false });
    }
  } catch (error) {
    console.log(error);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { otp1, otp2, otp3, otp4 } = req.body;
    const newOtp = Number(otp1 + otp2 + otp3 + otp4);
    const userId = req.body.userId;

    const userOtp = await otpDb.findOne({ userId: userId });
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const storedOtp = userOtp.otp;
    if (storedOtp === newOtp) {
      userOtp.otp = null;
      user.isVerified = true;
      await user.save();
      req.session.user_id = user._id;
      res.redirect("/home");
    } else {
      res.render("./user/otpVerification", { message: "Invalid OTP", userId });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error verifying OTP");
  }
};

const userLoginPage = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findOne({ _id: userId });
    const categories = await Category.find({ isListed: true }).lean();
    const categoryData = await Promise.all(categories.map(async (category) => {
      const count = await Products.countDocuments({
        category: category._id,
        isListed: true,
      });

      return {
        name: category.name,
        icon: category.icon, // Ensure you have an icon field in your Category model, or handle it differently.
        count: count,
      };
    }));

    const cart = await Cart.findOne({ user: userId }).populate('product.productId');
    const isEmpty = !cart || cart.product.length === 0;
    const products = cart ? cart.product : [];

    res.render("./user/login", { 
      user, 
      message: " ", 
      categories: categoryData, 
      isEmpty, 
      products 
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
};

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: "You are blocked" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    req.session.user_id = user._id;
    return res.json({ success: true });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "An error occurred during login." });
  }
};

const viewProduct = async (req, res) => {
  try {
    const user = req.session.user_id;

    const { q: search, sortBy = 'popularity', categoryId, page = 1, limit = 6 } = req.query;

    let filter = { isListed: true };

    if (categoryId && categoryId !== 'allProducts') {
      filter.category = categoryId;
    }
    if (search) {
      filter.name = { $regex: new RegExp(search, 'i') }; // Case-insensitive search
    }

    let sortOption = {};
    switch (sortBy) {
      case 'popularity': sortOption = { popularity: -1 }; break;
      case 'date': sortOption = { createdAt: -1 }; break;
      case 'A-Z': sortOption = { name: 1 }; break;
      case 'Z-A': sortOption = { name: -1 }; break;
      case 'HighToLow': sortOption = { price: -1 }; break;
      case 'LowToHigh': sortOption = { price: 1 }; break;
      default: sortOption = { createdAt: -1 };
    }

    const productsPerPage = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * productsPerPage;
    const totalProducts = await Products.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / productsPerPage);

    const products = await Products.find(filter)
      .populate('category')
      .sort(sortOption)
      .skip(skip)
      .limit(productsPerPage);

    const categories = await Category.find({ isListed: true }).lean();
    
    const cart = await Cart.findOne({ user: user }).populate('product.productId');
    const isEmpty = !cart || cart.product.length === 0;
    const cartProducts = cart ? cart.product : [];

    res.render('user/shop', { 
      products, 
      user, 
      categories, 
      currentPage: Number(page),
      totalPages,
      limit: productsPerPage,
      totalProducts,
      isEmpty,
      cartProducts,
        currentCategory: categoryId || ''
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send('Server Error');
  }
};


const filterProducts = async (req, res) => {
  try {
    const { search = '', categoryId, sortBy = 'popularity', page = 1, limit = 6 } = req.query;

    let filter = { isListed: true };
    if (search) {
      filter.name = { $regex: new RegExp(search, 'i') };
    }
    if (categoryId && categoryId !== 'allProducts') {
      filter.category = categoryId;
    }

    let sortOption = {};
    switch (sortBy) {
      case "popularity":
        sortOption = { popularity: -1 };
        break;
      case "date":
        sortOption = { createdAt: -1 };
        break;
      case "A-Z":
        sortOption = { name: 1 };
        break;
      case "Z-A":
        sortOption = { name: -1 };
        break;
      case "HighToLow":
        sortOption = { price: -1 };
        break;
      case "LowToHigh":
        sortOption = { price: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const productsPerPage = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * productsPerPage;
    const totalProducts = await Products.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / productsPerPage);

    const products = await Products.find(filter)
      .populate("category")
      .sort(sortOption)
      .skip(skip)
      .limit(productsPerPage);

    res.json({
      products,
      totalProducts,
      currentPage: Number(page),
      totalPages
    });
  } catch (error) {
    console.error("Error filtering products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};





const singleProduct = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findOne({ _id: userId });
    const productId = req.params.id;

    const singleProduct = await Products.findOne({ _id: productId }).populate("category");

    if (!singleProduct) {
      return res.status(404).render('404'); // Render a 404 page if the product is not found
    }

    const categories = await Category.find({ isListed: true }).lean();
    const categoryData = await Promise.all(categories.map(async (category) => {
      const count = await Products.countDocuments({
        category: category._id,
        isListed: true,
      });

      return {
        name: category.name,
        icon: category.icon,
        count: count,
      };
    }));

    const cart = await Cart.findOne({ user: userId }).populate('product.productId');
    const isEmpty = !cart || cart.product.length === 0;
    const products = cart ? cart.product : [];

    res.render("./user/singleProduct", { 
      singleProduct, 
      user, 
      categories: categoryData, 
      isEmpty, 
      products 
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
};



const loadLogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/home");
  } catch (error) {
    console.log("logout error", error);
  }
};

const loadUserProfile = async (req, res) => {
  try {
    const userId = req.session.user_id;

    // Fetch user data
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Fetch user's address
    const address = await Address.find({ user: userId });

    // Fetch user's orders with product details, sorted by date (latest first)
    const orders = await Order.find({ user: userId })
      .populate("product.productId")
      .sort({ Date: -1 });

    // Fetch user's wallet data
    const wallet = await Wallet.findOne({ user: userId });

    const walletData = wallet ? {
      balance: wallet.balance,
      transactions: wallet.transactions.sort((a, b) => b.date - a.date) // Sort transactions by date, newest first
    } : null;

    // Fetch categories
    const categories = await Category.find({ isListed: true }).lean();
    
    const categoryData = await Promise.all(categories.map(async (category) => {
      const count = await Products.countDocuments({
        category: category._id,
        isListed: true,
      });
      return {
        name: category.name,
        icon: category.icon,
        count: count,
      };
    }));

    // Fetch the user's cart
    const cart = await Cart.findOne({ user: userId })
      .populate('product.productId')
      .exec();

    // Render the user profile page with all the required data
    res.render("./user/userProfile", {
      userData: user,
      user,
      address,
      orders,
      walletData,
      categories: categoryData,
      cart
    });
  } catch (error) {
    console.error("Error loading user profile:", error);
    res.status(500).send("Error loading user profile");
  }
};
const editAddress = async (req, res) => {
  try {
    const {
      addressId,
      name,
      user,
      mobile,
      houseName,
      street,
      landmark,
      pincode,
      city,
      state,
    } = req.body;

    

    // Find the address by ID and update it
    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      {
        name,
        user,
        mobile,
        houseName,
        street,
        landmark,
        pincode,
        city,
        state,
      },
      { new: true } // Return the updated document
    );

    if (!updatedAddress) {
      return res.status(404).send("Address not found");
    }

    res.status(200).send(updatedAddress);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const getForgotPassword = (req, res) => {
  try {
    res.render("./user/forgotPassword");
  } catch (error) {
    console.error(error);
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  console.log(`Received forgot password request for email: ${email}`);

  if (!email) {
    return res.status(400).send("Email is required");
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`No user found with email: ${email}`);
      return res.status(400).send("No user with the email");
    }
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: user.email,
      from: "sooryadevanikkat2006@gmail.com",
      subject: "Forgot Password",
      text: `
        You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://${req.headers.host}/reset/${resetToken}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send("A reset link has been sent to your email");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

// Render the reset password page
const getResetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .send("Password reset token is invalid or has expired");
    }
    res.render("./user/resetPassword", { token: req.params.token }); // Ensure this matches your EJS file name
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

// Handle the reset password form submission
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .send("Password reset token is invalid or has expired.");
    }
    const spassword = await securePassword(password);

    // Ensure you hash the password before saving
    user.password = spassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    const update = await user.save();
    

    res.status(200).send("Password has been reset successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};
const addAddress = async (req, res) => {
  try {
    // Log the request body to see the incoming data
    console.log(req.body);

    // Ensure user ID is available in the session
    const userId = req.session.user_id;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User not authenticated" });
    }

    // Destructure data from the request body
    const { name, mobile, houseName, street, landmark, pincode, city, state } = req.body;

    // Check if the required fields are present
    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    // Create a new address with the user ID from the session
    const newAddress = new Address({
      name,
      user: userId, // Use user ID from the session
      mobile,
      houseName,
      street,
      landmark,
      pincode,
      city,
      state,
    });

    // Save the new address to the database
    await newAddress.save();

    // Respond with success message
    res.status(201).json({ success: true, message: "Address added successfully" });
  } catch (error) {
    // Log error and respond with failure message
    console.error("Error adding address:", error);
    res.status(500).json({ success: false, message: "An error occurred while adding the address" });
  }
};


const loadErrorPage = async (req, res) => {
  res.render("./user/404");
};
const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.body; // Extract addressId from body
    if (!addressId) {
      return res.status(400).json({ message: "Address ID is required" });
    }

    

    // Find and delete the address
    const result = await Address.findByIdAndDelete(addressId);
    if (!result) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the address" });
  }
};

// Express route

const signOut = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res
        .status(500)
        .json({ message: "An error occurred while signing out" });
    }
    res.redirect("/login"); // Redirect to login page after sign-out
  });
};

const postFilterProduct = async (req, res) => {
  try {
 
    let products;
    if (req.body.data === "allProducts") {
      products = await productModel.find().populate('category')
    } else {
      products = await productModel.find({ category: req.body.data }).populate('category')

 
    }

    // const category = await categoryModel.find()
    // res.render("user/shop", { products: filtered, user: req.user, category });

    res.json(products); 
  } catch (error) {
    console.log(error);
  }
};
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'New passwords do not match.' });
    }

    const user = await User.findById(req.session.user_id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update to new password
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully.' });

  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
}
const loadOrderTracking = async (req, res) => {
  try {
    const { orderId } = req.query;
    const orderData = await Order.findById(orderId)
      .populate('user')
      .populate('addressId')
      .populate('product.productId');

    if (!orderData) {
      return res.status(404).send("Order not found");
    }

    // Check if payment is pending or failed
    const showContinuePayment = ['Pending', 'Failed'].includes(orderData.paymentStatus);

    // Fetch categories
    const categories = await Category.find({ isListed: true }).lean();
    
    const categoryData = await Promise.all(categories.map(async (category) => {
      const count = await Products.countDocuments({
        category: category._id,
        isListed: true,
      });
      return {
        name: category.name,
        icon: category.icon,
        count: count,
      };
    }));

    // Fetch the user's cart
    const cart = await Cart.findOne({ user: req.session.user_id })
      .populate('product.productId')
      .exec();

    res.render('user/orderTracking', { 
      orderData: [orderData], 
      showContinuePayment,
      categories: categoryData,
      cart
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Error loading order tracking");
  }
};
const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId)
      .populate('user')
      .populate('addressId')
      .populate('product.productId');

    if (!order) {
      return res.status(404).send("Order not found");
    }

    if (order.status.toLowerCase() !== 'delivered' || order.returnStatus === 'Approved') {
      return res.status(400).send("Invoice not available for this order");
    }

    const doc = new PDFDocument();
    const filename = `invoice-${orderId}.pdf`;

    res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    // Add content to the PDF
    doc.fontSize(20).text('Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Order ID: ${order._id}`);
    const orderDate = order.Date ? order.Date.toDateString() : 'Date not available'; // Handle undefined date
    doc.text(`Date: ${orderDate}`);
    doc.moveDown();
    doc.text('Billing Address:');
    const address = order.addressId || {};
    doc.text(`${address.name || 'Name not available'}`);
    doc.text(`${address.houseName || 'House name not available'}`);
    doc.text(`${address.city || 'City not available'}, ${address.state || 'State not available'} ${address.pincode || 'Pincode not available'}`);
    doc.text(`${address.mobile || 'Mobile not available'}`);
    doc.moveDown();
    doc.text('Items:');
    order.product.forEach(item => {
      const product = item.productId || {};
      doc.text(`${product.name || 'Product name not available'} - Quantity: ${item.quantity} - Price: $${(product.price * item.quantity).toFixed(2)}`);
    });
    doc.moveDown();
    doc.text(`Subtotal: $${order.subtotal.toFixed(2)}`);
    if (order.discount > 0) {
      doc.text(`Discount: $${order.discount.toFixed(2)}`);
    }
    doc.text(`Total: $${(order.subtotal - order.discount).toFixed(2)}`);

    doc.end();
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Error generating invoice");
  }
};

const loadAbout=async (req,res)=>{
try {
  const user = req.session.user_id;

  res.render('./user/about',{
    userData: user,
    user,})
} catch (error) {
  console.log(error);
  
}
}


module.exports = {
  userHome,
  singleProduct,
  userLoginPage,
  userLogin,
  userRegistration,
  verifyOtp,
  sendOtp,
  viewProduct,
  resendOtp,
  loadLogout,
  otpPage,
  loadRegistration,
  loadUserProfile,
  getForgotPassword,
  resetPassword,
  getResetPassword,
  forgotPassword,
  addAddress,
  loadErrorPage,
  editAddress,
  deleteAddress,
  signOut,
  postFilterProduct,
  changePassword,
  filterProducts,
  loadOrderTracking,
  downloadInvoice,
  loadAbout
};
