const express = require("express");
const adminRouter = express.Router();
const adminController = require("../controller/adminController");
const Product = require("../model/productModel");
const productController = require("../controller/productController");
const categoryController = require("../controller/categoryController");
const multer = require("multer");
const path = require("path");
const auth = require("../middlewears/adminAuth");

adminRouter.use(
  express.static(path.join(__dirname, "..", "public", "uploads"))
);

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "public", "uploads", "resize"));
  },
  filename: function (req, file, cb) {
    console.log("fileName:", file);
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});
const upload = multer({ storage: storage });

adminRouter.get(
  "/adminLogin",
  auth.isAdminLogout,
  adminController.adminLoginPage
);
adminRouter.post("/adminLogin", adminController.adminLogin);

adminRouter.get(
  "/products",
  auth.isAdminLogin,
  productController.getProductList
);
adminRouter.get(
  "/products/add",
  auth.isAdminLogin,
  productController.getAddProductForm
);
adminRouter.post(
  "/products/add",
  upload.array("productImages", 4),
  productController.addProduct
);
adminRouter.get(
  "/adminDashboard",
  auth.isAdminLogin,
  adminController.adminDashboard
);
adminRouter.get(
  "/viewProducts",
  auth.isAdminLogin,
  productController.viewProducts
);
adminRouter.get(
  "/editProduct/:id",
  auth.isAdminLogin,
  productController.getEditProduct
);
adminRouter.post("/editProduct/:id", productController.editProduct);

// Category management
adminRouter.get(
  "/categories",
  auth.isAdminLogin,
  categoryController.getCategoryController
);
adminRouter.get(
  "/editCategory/:id",
  auth.isAdminLogin,
  categoryController.editCategory
);
adminRouter.post("/updateCategory/:id", categoryController.updateCategory);
adminRouter.get("/deleteCategory/:categoryId", categoryController.deleteCategory);
adminRouter.post("/create-category", categoryController.createCategory);

// User management
adminRouter.get(
  "/userManagement",
  auth.isAdminLogin,
  adminController.userManagement
);
adminRouter.post(
  "/userManagement/:userId/block",
  auth.isAdminLogin,
  adminController.blockUser
);
adminRouter.post(
  "/userManagement/:userId/unblock",
  auth.isAdminLogin,
  adminController.unblockUser
);

adminRouter.get("/logout", adminController.adminLogout);

adminRouter.post("/list-product/:productId", productController.listProduct);
adminRouter.post("/unlist-product/:productId", productController.unlistProduct);

// Order management
adminRouter.get("/orders", auth.isAdminLogin, adminController.loadOrder);
adminRouter.get("/orderDetails", auth.isAdminLogin, adminController.loadOrderDetails);
adminRouter.post("/orders/update-status", auth.isAdminLogin, adminController.OrderStatus);
adminRouter.post("/orders/cancel", auth.isAdminLogin, adminController.cancelOrder);

module.exports = adminRouter;

