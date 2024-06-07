const Product = require("../model/productModel");
const Admin = require("../model/admin");
const bcrypt = require("bcrypt");
const User = require("../model/userModel");

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
//       return res.render('./admin/adminLogin', { message: 'Admin already exists' });
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
    console.log("dfghjk");

    const admin = await Admin.findOne({ email });
    console.log(admin);
    if (!admin) {
      return res.render("./admin/adminLogin", {
        message: "Invalid email or password",
      });
    }
    console.log("dfghjk");

    const isPasswordMatch = await bcrypt.compare(password, admin.password);
    console.log("dfghjk");

    if (isPasswordMatch===false) {

      return res.render("./admin/adminLogin", {
        message: "Invalid email or password",
      });
    }
console.log("dfghjk");
    req.session.admin= admin._id;
    console.log(req.session.admin);

    res.redirect("/admin/adminDashboard");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("An error occurred during login.");
  }
};
const adminLogout = async (req, res) => {
  try {
    // Clear the admin session data
    req.session.admin = null;

    // Redirect the admin to the login page or home page
    res.redirect("/admin/adminLogin");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("An error occurred during logout.");
  }
};
const userManagement=async(req,res)=>{
  try {
    const users = await User.find();
    res.render("./admin/userManagement",{users})
  } catch (error) {
    console.log(error.message)
  }
}

const blockUser = async (req, res) => {
  const userId = req.params.userId;

  try {
    await User.findByIdAndUpdate(userId, { isBlocked: true });
    res.redirect("/admin/userManagement");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const unblockUser = async (req, res) => {
  const userId = req.params.userId;

  try {
    await User.findByIdAndUpdate(userId, { isBlocked: false });
    res.redirect("/admin/userManagement");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }

  const logout=async(req,res)=>{
    try{


    }catch(error){
      console.log(error);
    }
  }
};



module.exports = {
  adminLoginPage,
  adminLogin,
  adminDashboard,
  adminLogout,
  userManagement,
  blockUser,
  unblockUser,
  
};
