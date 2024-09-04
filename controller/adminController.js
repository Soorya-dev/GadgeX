const Product = require("../model/productModel");
const Admin = require("../model/admin");
const bcrypt = require("bcryptjs");
const User = require("../model/userModel");
const Order = require("../model/order");
const categoryModel = require("../model/categoryModel");
const Offer=require('../model/offerModel')
const PDFDocument = require('pdfkit');
const excel = require('excel4node');
const Wallet =require("../model/walletModel")


// for loading admin home
const adminDashboard = async (req, res) => {
  try {
    const { filter = 'weekly' } = req.query; // Default to weekly if no filter provided
    console.log("Filter selected:", filter);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set the time to midnight for accurate date comparisons

    let startDate, endDate;
    let groupBy, dateFormat;

    // Determine the date range and grouping format based on the selected filter
    switch (filter) {
      case 'daily':
        startDate = new Date(today);
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1);
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$Date" } }; // Use "$Date" field
        dateFormat = "%Y-%m-%d";
        break;
      case 'weekly':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        endDate = new Date(today);
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$Date" } }; // Use "$Date" field
        dateFormat = "%Y-%m-%d";
        break;
      case 'monthly':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$Date" } }; // Use "$Date" field
        dateFormat = "%Y-%m-%d";
        break;
      case 'yearly':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        groupBy = { $dateToString: { format: "%Y-%m", date: "$Date" } }; // Use "$Date" field
        dateFormat = "%Y-%m";
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        endDate = new Date(today);
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$Date" } }; // Use "$Date" field
        dateFormat = "%Y-%m-%d";
    }

    console.log("Start Date:", startDate);
    console.log("End Date:", endDate);
    console.log("Group By:", groupBy);

    // Aggregate sales data based on the selected filter
    const salesData = await Order.aggregate([
      {
        $match: {
          status: 'Delivered',
          Date: { $gte: startDate, $lte: endDate } // Filter using the "Date" field
        }
      },
      {
        $group: {
          _id: groupBy,
          total: { $sum: '$subtotal' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log("Aggregated Sales Data:", salesData);

    // Calculate total revenue
    const revenue = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: '$subtotal' } } }
    ]);
    console.log("Total Revenue:", revenue);

    // Calculate daily revenue
    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          status: 'Delivered',
          Date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } // Filter using "Date"
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$subtotal' }
        }
      }
    ]);
    console.log("Daily Revenue:", dailyRevenue);

    // Calculate weekly revenue
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weeklyRevenue = await Order.aggregate([
      {
        $match: {
          status: 'Delivered',
          Date: { $gte: weekStart, $lt: today } // Filter using "Date"
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$subtotal' }
        }
      }
    ]);
    console.log("Weekly Revenue:", weeklyRevenue);

    // Calculate monthly revenue
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          status: 'Delivered',
          Date: { $gte: monthStart, $lt: today } // Filter using "Date"
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$subtotal' }
        }
      }
    ]);
    console.log("Monthly Revenue:", monthlyRevenue);

    // Calculate yearly revenue
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const yearlyRevenue = await Order.aggregate([
      {
        $match: {
          status: 'Delivered',
          Date: { $gte: yearStart, $lt: today } // Filter using "Date"
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$subtotal' }
        }
      }
    ]);
    console.log("Yearly Revenue:", yearlyRevenue);

    // Get additional statistics
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments({ status: 'Delivered' });
    const totalProducts = await Product.countDocuments();
    const totalCategories = await categoryModel.countDocuments();

    console.log("Total Users:", totalUsers);
    console.log("Total Orders:", totalOrders);
    console.log("Total Products:", totalProducts);
    console.log("Total Categories:", totalCategories);

    // Top selling products
    const topSellingProducts = await Order.aggregate([
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.productId',
          totalQuantity: { $sum: '$product.quantity' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
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
          productName: '$productDetails.name',
          totalQuantity: 1
        }
      }
    ]);
    console.log("Top Selling Products:", topSellingProducts);

    // Top selling categories
    const topSellingCategories = await Order.aggregate([
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'products',
          localField: 'product.productId',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $lookup: {
          from: 'categories',
          localField: 'productDetails.category',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      { $unwind: '$categoryDetails' },
      {
        $group: {
          _id: '$categoryDetails._id',
          name: { $first: '$categoryDetails.name' },
          totalQuantity: { $sum: '$product.quantity' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);
    console.log("Top Selling Categories:", topSellingCategories);

    // Render the admin dashboard view
    res.render('admin/adminDashboard', {
      revenue,
      totalUsers,
      totalOrders,
      totalProducts,
      totalCategories,
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue,
      yearlyRevenue,
      salesDataJSON: JSON.stringify(salesData), // Send the sales data as a JSON string
      topSellingProducts,
      topSellingCategories,
      currentFilter: filter
    });

  } catch (error) {
    console.error("Error in adminDashboard:", error.message);
    res.status(500).send('Internal Server Error');
  }
};






// Helper function to get aggregated sales data
const getAggregatedSales = async (timeUnit) => {
  return await Order.aggregate([
    {
      $group: {
        _id: { [timeUnit]: '$Date' },
        totalSales: { $sum: { $subtract: ['$subtotal', '$discount'] } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

const salesReport = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'Delivered' }).populate("user addressId product.productId");
    
    // Calculate overall statistics
    const overallSalesCount = orders.length;
    const overallOrderAmount = orders.reduce((total, order) => total + (order.subtotal - order.discount), 0);

    console.log("Sales Report Data:");
    console.log("Total Orders:", overallSalesCount);
    console.log("Total Order Amount:", overallOrderAmount.toFixed(2));

    res.render("admin/salesReport", { orders, overallSalesCount, overallOrderAmount });
  } catch (error) {
    console.log("Error fetching sales report:", error);
    res.status(500).send("Internal Server Error");
  }
};


const getSalesData = async (req, res) => {
  try {
    const { startDate, endDate, filter } = req.query;
    let query = { status: 'Delivered' };

    if (startDate && endDate) {
      query.Date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else {
      let start = new Date();
      switch (filter) {
        case 'daily':
          start.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          start.setDate(start.getDate() - 7);
          break;
        case 'monthly':
          start.setMonth(start.getMonth() - 1);
          break;
        case 'yearly':
          start.setFullYear(start.getFullYear() - 1);
          break;
        default:
          start.setHours(0, 0, 0, 0);
      }
      query.Date = { $gte: start };
    }

    console.log("Sales Data Query:", query); // Log the query object to see what is being queried
    
    const orders = await Order.find(query).populate("user addressId product.productId");
    
    console.log("Fetched Orders:", orders); // Log the orders fetched

    const salesCount = orders.length;
    const totalAmount = orders.reduce((total, order) => total + (order.subtotal - order.discount), 0);

    console.log("Sales Data Statistics:");
    console.log("Total Orders:", salesCount);
    console.log("Total Amount:", totalAmount.toFixed(2));

    const salesData = {
      orders: orders,
      salesCount,
      totalAmount
    };

    res.json(salesData);
  } catch (error) {
    console.error("Error fetching sales data:", error);
    res.status(500).send('Internal Server Error');
  }
};


const downloadSalesReportPDF = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'Delivered' }).populate("user addressId product.productId");
    
    const doc = new PDFDocument();
    const filename = 'SalesReport.pdf';

    res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    // Set up heading
    doc.fontSize(20).font('Helvetica-Bold').text('Sales Report', { align: 'center' });
    doc.moveDown(); // Move down to provide space for the heading

    // Table setup
    const tableTop = doc.y + 20; // 20 units below the heading
    const itemHeight = 20;
    const rowWidth = 500;
    const columnWidths = [80, 150, 150, 100, 100]; // Adjust column widths as needed

    // Draw table header
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Order ID', 50, tableTop, { width: columnWidths[0] });
    doc.text('User', 150, tableTop, { width: columnWidths[1] });
    doc.text('Date', 300, tableTop, { width: columnWidths[2] });
    doc.text('Subtotal', 450, tableTop, { width: columnWidths[3] });
    doc.text('Discount', 550, tableTop, { width: columnWidths[4] });

    // Draw table rows
    doc.fontSize(10).font('Helvetica');
    orders.forEach((order, index) => {
      const y = tableTop + itemHeight * (index + 1);
      doc.text(order._id.toString(), 50, y, { width: columnWidths[0] });
      doc.text(order.user ? order.user.name : 'N/A', 150, y, { width: columnWidths[1] });
      doc.text(order.Date.toLocaleDateString(), 300, y, { width: columnWidths[2] });
      doc.text(`$${(order.subtotal - order.discount).toFixed(2)}`, 450, y, { width: columnWidths[3] });
      doc.text(`$${order.discount.toFixed(2)}`, 550, y, { width: columnWidths[4] });
    });

    doc.end();
  } catch (error) {
    console.log("Error generating PDF report:", error);
    res.status(500).send("Internal Server Error");
  }
};

const downloadSalesReportExcel = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'Delivered' }).populate("user addressId product.productId");
    
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    const style = workbook.createStyle({
      font: {
        bold: true,
        color: '#000000',
        size: 12,
      },
    });

    // Add headers
    worksheet.cell(1, 1).string('Order ID').style(style);
    worksheet.cell(1, 2).string('User').style(style);
    worksheet.cell(1, 3).string('Date').style(style);
    worksheet.cell(1, 4).string('Total').style(style);

    // Add data
    orders.forEach((order, index) => {
      worksheet.cell(index + 2, 1).string(order._id.toString());
      worksheet.cell(index + 2, 2).string(order.user.name);
      worksheet.cell(index + 2, 3).string(order.Date.toLocaleDateString());
      worksheet.cell(index + 2, 4).number(parseFloat((order.subtotal - order.discount).toFixed(2)));
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader("Content-Disposition", "attachment; filename=" + "SalesReport.xlsx");

    workbook.write('SalesReport.xlsx', res);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
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
    // console.log(req.body);

    const admin = await Admin.findOne({ email });
    // console.log(admin);
    if (!admin) {
      return res.render("./admin/adminLogin", {
        message: "Invalid email or password",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, admin.password);

    if (isPasswordMatch === false) {
      return res.render("./admin/adminLogin", {
        message: "Invalid email or password",
      });
    }

    req.session.admin = admin._id;
    // req.session.admin='65fd102c4e85065509ecca42'
    // console.log(req.session.admin);

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
const userManagement = async (req, res) => {
  try {
    const users = await User.find();
    res.render("./admin/userManagement", { users });
  } catch (error) {
    console.log(error.message);
  }
};

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

  const logout = async (req, res) => {
    try {
    } catch (error) {
      console.log(error);
    }
  };
};

const loadOrder = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments();
    const totalPages = Math.ceil(totalOrders / limit);

    const orders = await Order.find()
      .populate("user")
      .populate("product.productId")
      .populate("addressId")
      .sort({ Date: -1 }) // Sort by Date in descending order
      .skip(skip)
      .limit(limit);

    res.render("./admin/orders", {
      orders,
      currentPage: page,
      totalPages,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error("Error loading orders:", error);
    req.flash('error', 'An error occurred while loading the orders');
    res.redirect('/admin/orders');
  }
};

// Load order details
const loadOrderDetails = async (req, res) => {
  try {
    const orderId = req.query.id; // Assuming the order ID is passed as a query parameter
    const order = await Order.findById(orderId)
      .populate("user")
      .populate("product.productId")
      .populate("addressId");

    if (!order) {
      return res.status(404).send("Order not found");
    }

    res.render("./admin/orderDetails", {
      order,
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
      req.flash('error', 'Order not found');
      return res.redirect('/admin/orders');
    }

    order.status = status;
    await order.save();

    req.flash('success', 'Order status updated successfully');
    res.redirect("/admin/orders");
  } catch (error) {
    console.error("Error updating order status:", error);
    req.flash('error', 'An error occurred while updating the order status');
    res.redirect('/admin/orders');
  }
};
const adminCancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      req.flash('error', 'Order not found');
      return res.redirect('/admin/orders');
    }

    // Check if the order status is 'Delivered'
    if (order.status !== 'Delivered') {
      req.flash('error', 'Order can only be cancelled after it has been delivered');
      return res.redirect('/admin/orders');
    }

    order.status = "Cancelled";

    // Handle refund based on payment method
    if (order.paymentMethod === 'Wallet' || order.paymentMethod === 'paypal' || order.paymentMethod === 'COD') {
      let wallet = await Wallet.findOne({ user: order.user });
      
      if (!wallet) {
        wallet = new Wallet({ user: order.user, balance: 0 });
      }

      wallet.balance += order.subtotal;
      wallet.transactions.push({
        type: 'credit',
        amount: order.subtotal,
        description: `Refund for cancelled order ${order._id}`
      });
      await wallet.save();
    }

    // Restore product stock
    for (const item of order.product) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
    }

    await order.save();

    req.flash('success', 'Order cancelled and refunded successfully');
    res.redirect("/admin/orders");
  } catch (error) {
    console.error("Error canceling order:", error);
    req.flash('error', 'An error occurred while cancelling the order');
    res.redirect('/admin/orders');
  }
};
const processReturnRequest = async (req, res) => {
  try {
    const { orderId, action } = req.body;

    if (action !== 'Approved' && action !== 'Rejected') {
      return res.status(400).send('Invalid action');
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).send('Order not found');
    }

    order.returnStatus = action;

    if (action === 'Approved') {
      order.status = 'Returned';

      // Handle refund based on payment method
      if (order.paymentMethod === 'Wallet' || order.paymentMethod === 'paypal' ||order.paymentMethod==='COD') {
        const wallet = await Wallet.findOne({ user: order.user });
        
        if (!wallet) {
          const newWallet = new Wallet({ user: order.user, balance: order.subtotal });
          await newWallet.save();
        } else {
          wallet.balance += order.subtotal;
          wallet.transactions.push({
            type: 'credit',
            amount: order.subtotal,
            description: `Refund for returned order ${order._id}`
          });
          await wallet.save();
        }
      }

      // Restore product stock
      for (const item of order.product) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
      }
    }

    await order.save();

    req.flash('success', `Return request ${action.toLowerCase()} successfully`);
    res.redirect('/admin/orders');
  } catch (error) {
    console.error('Error processing return request:', error);
    req.flash('error', 'An error occurred while processing the return request');
    res.redirect('/admin/orders');
  }
};

const patchListCategory = async (req, res) => {
  try {


    const category = await categoryModel.findOne({ _id: req.body.categoryId });
    category.isListed = !category.isListed;

   const updated =  await category.save();

   
   res.json({data:updated})

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
  adminCancelOrder,
  patchListCategory,
  salesReport,
  getSalesData,
  downloadSalesReportPDF,
  downloadSalesReportExcel,
  processReturnRequest
};
