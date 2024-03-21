const otpDb = require("../model/otpModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const Products = require("../model/productModel");
const User = require("../model/userModel");

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
const userRegistration = async (req, res) => {
  try {
    console.log("body:", req.body);

    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    console.log("Generated ", otp);

    sendOtp(req.body.email, otp); // Replace sendOTP function with your actual sending logic

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
      return res.render("./user/otpVerification", {
        userId: user._id,
      });
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
        user: "sooryadevanikkat2006@gmail.com",
        pass: "dztt wwid nxnr yxgw",
      },
    });

    const mailOptions = {
      from: "sooryadevanikkat2006@gmail.com",
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
    const user = await User.findOne({ _id: userId });
    
    res.render("./user/login", { user });
  } catch (error) {
    console.log(error.message);
  }
};

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("user login err", req.body);

    // Check if email exists
    const user = await User.findOne({ email: email });
    console.log("user Email:", user);
    if(user.isBlocked){
      return res.render("./user/login",{message: "User is Blocked",user})
      
      
    }
    if (!user) {
      return res.render("./user/login", {
        message: "Invalid email or password",
      });
    }

    // Compare hashed password with login password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    console.log("aaaaaaaaaaaaa", isPasswordMatch);

    if (!isPasswordMatch) {
      return res.render("./user/login", {
        message: "Invalid email or password",
      });
    }

    // Login successful (optional: set user in session)
    req.session.user_id = user._id;
    console.log("userID:", req.session.user_id);
    res.redirect("/");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("An error occurred during login.");
  }
};

const viewProduct = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findOne({ _id: userId });
    const products = await Products.find({});
    res.render("./user/shop", { products ,user});
  } catch (error) {
    console.log(error.message);
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
    res.render("./user/singleProduct", { singleProduct,user });
  } catch (error) {
    console.log(error.message);
  }
};

const loadLogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log("logout error", error.message);
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
};
