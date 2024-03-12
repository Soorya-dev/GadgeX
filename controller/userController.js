const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');

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
    res.render("user/homeTemplate");
  } catch (error) {
    console.log(error.message);
  }
};

const userLogin = async (req, res) => {
  try {
    res.render("user/login");
  } catch (error) {
    console.log(error);
  }
};
const userRegistration = async (req, res) => {
  try {
    console.log("body:", req.body);

    // Generate OTP
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    console.log("Generated ", otp); 

    // Example: Send OTP via SMS or email
    sendOTP(req.body.email, otp); // Replace sendOTP function with your actual sending logic

    const userExist = await User.findOne({ email: req.body.email });
    if (userExist) {
      return res.render("user/login", { message: "User already exists" });
    }

    const spassword = await securePassword(req.body.password);
    console.log(spassword);
    const user = new User({
      name: req.body.username,
      email: req.body.email,
      mobile: req.body.phonenumber,
      password: spassword,
      is_admin: 0,
    });
    // const userData = await user.save();

    // if (userData) {
    //   return res.render("user/otpVerification", {
    //     message:
    //       "An OTP has been sent to your email. Please verify to complete registration.",
    //   });
    // } else {
    //   return res.render("user/login", {
    //     message: "Your registration has failed",
    //   });
    // }
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("An error occurred during registration.");
  }
};

// Function to send OTP via email
async function sendOTP(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: "sooryadevanikkat2006@gmail.com",
          pass: "dztt wwid nxnr yxgw",
      },
    });

    const mailOptions = {
      from: "sooryadevanikkat2006@gmail.com",
      to: email,
      subject: "Verify your email",
      html: `<div>Your OTP: ${otp}</div>`
    };

    // Send mail with defined transport object
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error occurred while sending email:", error);
  }
}


module.exports = { userHome, userLogin, userRegistration };






// user:"sooryadevanikkat2006@gmail.com",
// pass: "dztt wwid nxnr yxgw",