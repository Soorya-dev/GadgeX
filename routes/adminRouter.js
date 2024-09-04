const express = require("express");
const adminRouter = express.Router();
const path = require("path");
const multer = require("multer");

// Controllers
const adminController = require("../controller/adminController");
const productController = require("../controller/productController");
const categoryController = require("../controller/categoryController");
const couponController = require("../controller/couponController");
const offerController = require("../controller/offerController");
const orderController = require("../controller/orderController");

// Middleware for authentication
const auth = require("../middlewears/adminAuth");

// Serve static files from the "public/uploads" directory
adminRouter.use(express.static(path.join(__dirname, "..", "public", "uploads")));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "public", "uploads", "resize")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage: storage });

// Admin authentication routes
adminRouter.get("/adminLogin", auth.isAdminLogout, adminController.adminLoginPage); // Admin login page
adminRouter.post("/adminLogin", adminController.adminLogin); // Admin login action
adminRouter.get("/logout", adminController.adminLogout); // Admin logout action

// Admin dashboard
adminRouter.get("/adminDashboard", auth.isAdminLogin, adminController.adminDashboard); // Admin dashboard

// Product management routes
adminRouter.get("/products", auth.isAdminLogin, productController.getProductList); // Get product list
adminRouter.get("/products/add", auth.isAdminLogin, productController.getAddProductForm); // Get add product form
adminRouter.post("/products/add", upload.array("croppedImages", 4), productController.addProduct); // Add product
adminRouter.get("/viewProducts", auth.isAdminLogin, productController.viewProducts); // View products
adminRouter.get("/editProduct/:id", auth.isAdminLogin, productController.getEditProduct); // Get edit product form
adminRouter.post("/editProduct/:id", productController.editProduct); // Edit product
adminRouter.post("/viewProducts/listProduct/:productId", productController.listProduct); // List product
adminRouter.post("/viewProducts/unlistProduct/:productId", productController.unlistProduct); // Unlist product

// Category management routes
adminRouter.get("/categories", auth.isAdminLogin, categoryController.getCategoryController); // Get categories
adminRouter.get("/editCategory/:id", auth.isAdminLogin, categoryController.editCategory); // Get edit category form
adminRouter.post("/updateCategory/:id", categoryController.updateCategory); // Update category
adminRouter.get("/deleteCategory/:categoryId", categoryController.deleteCategory); // Delete category
adminRouter.post("/create-category", categoryController.createCategory); // Create category
adminRouter.post("/categories/unlistCategory/:id", categoryController.unlistCategory); // Unlist category
adminRouter.post("/categories/listCategory/:id", categoryController.listCategory); // List category

// User management routes
adminRouter.get("/userManagement", auth.isAdminLogin, adminController.userManagement); // User management
adminRouter.post("/userManagement/:userId/block", auth.isAdminLogin, adminController.blockUser); // Block user
adminRouter.post("/userManagement/:userId/unblock", auth.isAdminLogin, adminController.unblockUser); // Unblock user

// Order management routes
adminRouter.get("/orders", auth.isAdminLogin, adminController.loadOrder); // Get orders
adminRouter.get("/orderDetails", auth.isAdminLogin, adminController.loadOrderDetails); // Get order details
adminRouter.post("/orders/update-status", auth.isAdminLogin, adminController.OrderStatus); // Update order status
adminRouter.post("/orders/cancel", auth.isAdminLogin, adminController.adminCancelOrder); // Cancel order
adminRouter.post('/orders/process-return-request', auth.isAdminLogin, adminController.processReturnRequest);


// List Category Patch Route
adminRouter.patch('/listCategory', adminController.patchListCategory); // Patch list category

// Coupon management
adminRouter.get('/coupon', auth.isAdminLogin, couponController.loadCoupon); 
adminRouter.get('/deleteCoupon/:id', couponController.deleteCoupon);
adminRouter.post('/updateCoupon/:id', couponController.updateCoupon);
adminRouter.get('/getCoupon/:id',couponController.getCoupon);
adminRouter.post('/addCoupon', auth.isAdminLogin, couponController.addCoupon); 
adminRouter.post('/checkCouponCode', couponController.checkCouponCode);
//offer
adminRouter.get('/offer',  offerController.loadOffer);
adminRouter.post('/addOffer',  offerController.addOffer);
adminRouter.get('/offer/deleteOffer',  offerController.deleteOffer);                
adminRouter.get('/getOffer/:productId',  offerController.getOffer);                
adminRouter.post('/applyOfferToProduct/:productId/:offerId',  offerController.applyOfferToProduct);                
adminRouter.get('/getOffersForProduct/:productId', offerController.getOffersForProduct);
adminRouter.post('/applyOffer', offerController.applyOffer);   

adminRouter.get('/getOffersForCategory/:categoryId', offerController.getOffersForCategory);
adminRouter.post('/applyCategoryOffer', offerController.applyCategoryOffer);



//sales report
adminRouter.get('/salesReport', auth.isAdminLogin, adminController.salesReport); // sales report
adminRouter.get('/getSalesData', auth.isAdminLogin, adminController.getSalesData);
adminRouter.get('/downloadSalesReportPDF', auth.isAdminLogin, adminController.downloadSalesReportPDF);
adminRouter.get('/downloadSalesReportExcel', auth.isAdminLogin, adminController.downloadSalesReportExcel);

module.exports = adminRouter;

