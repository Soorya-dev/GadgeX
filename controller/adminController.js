const Product = require("../model/productModel");
const Admin = require("../model/admin");
const bcrypt = require("bcrypt");
const User = require("../model/userModel");
const Order = require("../model/order");

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


    const admin = await Admin.findOne({ email });
    console.log(admin);
    if (!admin) {
      return res.render("./admin/adminLogin", {
        message: "Invalid email or password",
      });
    }


    const isPasswordMatch = await bcrypt.compare(password, admin.password);
    

    if (isPasswordMatch===false) {

      return res.render("./admin/adminLogin", {
        message: "Invalid email or password",
      });
    }




    // req.session.admin= admin._id;
    req.session.admin='65fd102c4e85065509ecca42'
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

const loadOrder = async (req, res) => {
  try {
    const orders = await Order.find().populate('user').populate('product.productId').populate('addressId');
    res.render('./admin/orders', {
      orders
    });
  } catch (error) {
    console.error("Error loading orders:", error);
    res.status(500).send("Internal Server Error");
  }
};


// Load order details
const loadOrderDetails = async (req, res) => {
  try {
    const orderId = req.query.id; // Assuming the order ID is passed as a query parameter
    const order = await Order.findById(orderId)
      .populate('user')
      .populate('product.productId')
      .populate('addressId');

    if (!order) {
      return res.status(404).send("Order not found");
    }

    res.render('./admin/orderDetails', {
      order
    });
  } catch (error) {
    console.error("Error loading order details:", error);
    res.status(500).send("Internal Server Error");
  }
};

const OrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).send("Order not found");
    }

    order.status = status;
    await order.save();

    res.redirect('/admin/orders');
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).send("Internal Server Error");
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).send("Order not found");
    }

    order.status = 'Canceled';
    await order.save();

    res.redirect('/admin/orders');
  } catch (error) {
    console.error("Error canceling order:", error);
    res.status(500).send("Internal Server Error");
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
  loadOrder,
  loadOrderDetails,
  OrderStatus,
  cancelOrder
  
};
