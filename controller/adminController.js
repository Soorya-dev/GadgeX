const Product = require("../model/productModel");
const Admin = require("../model/admin");
const bcrypt = require("bcrypt");

const adminDashboard = async (req, res) => {
  try {
    res.render("admin/adminDashboard");
  } catch (error) {
    console.log(error);
  }
};

const adminLoginPage = async (req, res) => {
  try {
    res.render("admin/adminLogin");
  } catch (error) {
    console.error(error);
  }
};

// const adminLogin = async (req, res) => {
//   try {
//     const { username, email, password } = req.body;

//     // Check if admin already exists
//     const existingAdmin = await Admin.findOne({ email });
//     if (existingAdmin) {
//       return res.render('./admin/adminRegister', { message: 'Admin already exists' });
//     }
// console.log(req.body);
//     // Hash the password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create a new admin object
//     const newAdmin = new Admin({
//       username,
//       email,
//       password: hashedPassword // Save the hashed password to the database
//     });

//     // Save the new admin to the database
//     await newAdmin.save();

//     res.redirect('/admin/login'); // Redirect to the login page after successful registration
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).send('An error occurred during registration.');
//   }
// };

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.render("./admin/adminLogin", {
        message: "Invalid email or password",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, admin.password);

    if (!isPasswordMatch) {
      return res.render("./admin/adminLogin", {
        message: "Invalid email or password",
      });
    }

    req.session.adminId = admin;

    res.redirect("/admin/adminDashboard");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("An error occurred during login.");
  }
};

module.exports = {
  adminLoginPage,
  adminLogin,
  adminDashboard,
};
