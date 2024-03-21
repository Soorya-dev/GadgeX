const express = require("express");
const adminRouter = express.Router();
const adminController = require("../controller/adminController");
const Product = require("../model/productModel"); 
const productController = require("../controller/productController");
const categoryController = require("../controller/categoryController");
const multer = require("multer");
const path = require("path");
const auth = require('../middlewears/adminAuth');


adminRouter.use(
  express.static(path.join(__dirname, "..", "public", "uploads"))
);
// Multer setup for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "public", "uploads"));
  },
  filename: function (req, file, cb) {
    console.log('fileName:',file);
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});
const upload = multer({ storage: storage });

adminRouter.get("/adminLogin",auth.isAdminLogout,adminController.adminLoginPage);
adminRouter.post("/adminLogin", adminController.adminLogin);
adminRouter.get("/products",auth.isAdminLogin, productController.getProductList);
adminRouter.get("/products/add", productController.getAddProductForm);
adminRouter.post(
  '/products/add',
  upload.array('productImages', 4), 
  productController.addProduct
);
adminRouter.get("/adminDashboard", adminController.adminDashboard);
adminRouter.delete("/products/:productId", productController.deleteProduct);

adminRouter.get("/viewProducts", productController.viewProducts);



//category management
adminRouter.get("/categories", categoryController.getCategoryController);
//create category
adminRouter.post("/create-category", categoryController.createCategory);
adminRouter.get('/userManagement',adminController.userManagement)
adminRouter.post('/userManagement/:userId/block', adminController.blockUser);
adminRouter.post('/userManagement/:userId/unblock', adminController.unblockUser);

// adminRouter.post("/products/edit/:productId",upload.single("productImage"), productController.editProduct);


module.exports = adminRouter;
