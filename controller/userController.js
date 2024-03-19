const User = require("../model/userModel");
const otpDb = require("../model/otpModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

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
      res.render("./user/homeTemplate");

    
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
  } catch (error) {
    console.error("Error occurred while sending email:", error);
  }
};




// var timer;
// var countdown = 60; // Resend timeout in seconds

// // Function to start the timer
// function startTimer() {
//   countdown = 60;
//   document.getElementById('timer').style.display = 'block';
//   document.getElementById('resend-btn').disabled = true; // Disable resend button initially
//   updateTimer();
//   timer = setInterval(updateTimer, 1000);
// }

// // Function to update the timer
// function updateTimer() {
//   countdown--;
//   document.getElementById('countdown').textContent = countdown;
//   if (countdown <= 0) {
//     clearInterval(timer);
//     document.getElementById('timer').style.display = 'none';
//     document.getElementById('resend-btn').disabled = false; // Enable resend button
//   }
// }

// // Function to resend OTP
// async function resendOtp() {
//   try {
//     const userId = document.querySelector('input[name="userId"]').value;

//     // Make an AJAX request to the server to resend OTP
//     const response = await fetch('/resend-otp', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ userId }),
//     });

//     if (!response.ok) {
//       throw new Error('Failed to resend OTP');
//     }

//     const data = await response.json();
//     if (data.success) {
//       console.log('OTP resent successfully');
//       startTimer(); // Restart the timer after successful resend
//     } else {
//       console.error('Error:', data.message);
//       alert('Failed to resend OTP. Please try again later.');
//     }
//   } catch (error) {
//     console.error('Error resending OTP:', error);
//     alert('An error occurred. Please try again later.');
//   }
// }

// // Start the timer when the page loads
// startTimer();









































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



const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("thengaaaaaaaaaa", req, body);

    // Check if email exists
    const user = await User.findOne({ email });
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
    req.session.user = user; // Assuming you're using sessions

    res.redirect("/home"); // Redirect to home page or desired route
  } catch (error) {
    console.error(error.message);
    res.status(500).send("An error occurred during login.");
  }
};

const userLoginPage = async (req, res) => {
  try {
    res.render("./user/login");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  userHome,
  userLoginPage,
  userLogin,
  userRegistration,
  verifyOtp,
  sendOtp,
  // resendOtp
};

// user:"sooryadevanikkat2006@gmail.com",
// pass: "dztt wwid nxnr yxgw"
