const otpDb = require("../model/otpModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const Products = require("../model/productModel");
const User = require("../model/userModel");
const Order = require("../model/order");
const Address = require("../model/addressModel");
const Category = require("../model/categoryModel");
const crypto = require('crypto');


const { message } = require("statuses");

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const userHome = async (req, res) => {
  try {
    const userId = req.session.user_id;
    console.log("id:", userId);
    const user = await User.findOne({ _id: userId });

    console.log("userId", userId);
    res.render("./user/homeTemplate", { user });
  } catch (error) {
    console.log(error.message);
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
    res.render("./user/register", { user: "hello", message: "" });
  } catch (error) {
    console.log(error);
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
    console.log("body:", req.body);
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    console.log("Generated ", otp);

    // Replace sendOTP function with your actual sending logic

    const userExist = await User.findOne({ email: req.body.email });
    // if (userExist) {
    //   return res.render("user/login", { message: "User already exists" });
    // }

    const spassword = await securePassword(req.body.password);
    console.log(spassword);
    const user = new User({
      name: req.body.username,
      email: req.body.email,
      mobile: req.body.phonenumber,
      password: spassword,
      is_admin: 0,
    });

    const userData = await user.save();

    if (userData) {
      const user = await User.findOne({ email: req.body.email });
      const userOtp = new otpDb({
        otp: otp,
        userId: user._id,
      });
      await userOtp.save();

      // Send OTP and wait for it to complete
      await sendOtp(req.body.email, otp);

      // Render OTP verification page after OTP is sent
      return res.json({ success: true, userId: user._id });
    } else {
      return res.render("./user/login", {
        message: "Your registration has failed",
      });
    }
  } catch (error) {
    console.log(error.message);
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

    // Send mail with defined transport object
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
    console.log("userId", userId);
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
    console.log(error.message);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { otp1, otp2, otp3, otp4 } = req.body;
    newOtp = Number(otp1 + otp2 + otp3 + otp4);
    console.log(req.body, newOtp);
    const userId = req.body.userId;
    console.log("userId", userId);
    const userOtp = await otpDb.findOne({ userId: userId });
    const user = await User.findOne({ _id: userId });

    console.log(userOtp);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const storedOtp = userOtp.otp;
    if (storedOtp === newOtp) {
      user.otp = null;
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
console.log();
    const user = await User.findOne({ _id: userId });

    // Pass flash messages to the template
    res.render("./user/login", { user, message: req.flash });
  } catch (error) {
    console.log(error.message);
  }
};

const userLogin = async (req, res) => {
  try {
    console.log(req.body);
    const { email, password } = req.body;
    console.log("body:", req.body);

    // Check if email exists
    const user = await User.findOne({ email: email });
    if (!user) {
      console.log("user not found");
      req.flash("error", "Invalid email or password");
      return res.redirect("/login");
    }

    // Check if user is blocked
    if (user.isBlocked) {
      console.log("blocked");
      req.flash("error", "User is Blocked");
      return res.redirect("/login");
    }

    // Compare hashed password with login password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      console.log("password not match");
      req.flash("error", "Invalid email or password");
      return res.redirect("/login");
    }

    // Login successful (set user in session)
    req.session.user_id = user._id;
    console.log("userID:", req.session.user_id);
    return res.json({ success: true });
  } catch (error) {
    console.error(error.message);
    req.flash("error", "An error occurred during login.");
    res.status(500).send("An error occurred during login.");
  }
};

const viewProduct = async (req, res) => {
  try {

const search=req.query.q;
if (search) {
  filter.name = { $regex: '.*' + search + '.*', $options: 'i' }; // Case-insensitive regex search
}



    const user = req.session.user_id;
    const { sortBy, filteredBy } = req.query; // Combine destructuring
    console.log(filteredBy,"1234321");

    let filter = {}; // Define the filter object

    // Apply ID filter if filteredBy is provided
    if (filteredBy) {
      filter.category = filteredBy; // Filter products by category
    }

    // Fetch products from the database using the filter
    const products = await Products.find(filter);

    let sortedProducts;

    // Sorting logic
    switch (sortBy) {
      case "popularity":
        sortedProducts = products.sort((a, b) => b.popularity - a.popularity);
        break;
      case "rating":
        sortedProducts = products.sort((a, b) => b.rating - a.rating);
        break;
      case "date":
        sortedProducts = products.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case "A-Z":
        sortedProducts = products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "Z-A":
        sortedProducts = products.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "HighToLow":
        sortedProducts = products.sort((a, b) => b.price - a.price);
        break;
      case "LowToHigh":
        sortedProducts = products.sort((a, b) => a.price - b.price);
        break;
      default:
        sortedProducts = products;
        break;
    }

    // Fetch categories for the dropdown
    const category = await Category.find({ is_list: true });

    res.render("user/shop", { products: sortedProducts, user, category });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};


const singleProduct = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findOne({ _id: userId });
    let productId = req.params.id;
    console.log("productId:", productId);
    let singleProduct = await Products.findOne({ _id: productId });
    console.log("single ", singleProduct.name);
    res.render("./user/singleProduct", { singleProduct, user });
  } catch (error) {
    console.log(error.message);
  }
};

const loadLogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/home");
  } catch (error) {
    console.log("logout error", error.message);
  }
};
const loadUserProfile = async (req, res) => {
  try {
    const userId = req.session.user_id;

    // Fetch the address data
    const address = await Address.find({ user: userId });
    console.log("addresses", address);

    // Fetch the user data
    const user = await User.findById(userId);
    console.log("user profile", user);
    if (!user) {
      throw new Error("User not found");
    }

    // Fetch the orders for the user
    const orders = await Order.find({ user: userId }).populate(
      "product.productId"
    );
    console.log("user orders", orders);

    // Render the user profile template with the user, address, and orders data
    res.render("./user/userProfile", { userData: user, user, address, orders });
  } catch (error) {
    console.error("Error loading user profile:", error);
    res.status(500).send("Error loading user profile");
  }
};

const getForgotPassword = (req, res) => {
  try {
    res.render("./user/forgotPassword")
  } catch (error) {
    
  }
}


// Handle the forgot password form submission
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  console.log(`Received forgot password request for email: ${email}`);

  if (!email) {
    return res.status(400).send('Email is required');
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`No user found with email: ${email}`);
      return res.status(400).send('No user with the email');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: user.email,
      from: 'sooryadevanikkat2006@gmail.com',
      subject: 'Forgot Password',
      text: `
        You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://${req.headers.host}/reset/${resetToken}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send('A reset link has been sent to your email');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
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
      return res.status(400).send('Password reset token is invalid or has expired');
    }
    res.render('resetPassword', { token: req.params.token }); // Ensure this matches your EJS file name
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
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
      return res.status(400).send('Password reset token is invalid or has expired.');
    }

    // Ensure you hash the password before saving
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).send('Password has been reset successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

const addAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    console.log("req.body hello", req.body);
    const {
      name,
      user,
      mobile,
      houseName,
      street,
      landmark,
      pincode,
      city,
      state,
      default: isDefault,
    } = req.body;
    const newAddress = new Address({
      name,
      user: userId,
      mobile,
      houseName,
      street,
      landmark,
      pincode,
      city,
      state,
      default: true,
    });
    await newAddress.save();
    res.status(201).json({ message: "Address added successfully" });
  } catch (error) {
    console.error("Error adding address:", error);
    res
      .status(500)
      .json({ message: "An error occurred while adding the address" });
  }
};

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
};
