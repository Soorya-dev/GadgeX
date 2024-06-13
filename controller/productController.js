const Product = require("../model/productModel");
const Category = require("../model/categoryModel");
const Admin = require("../model/admin");
const multer = require("multer");
const mongoose = require("mongoose");
const { log } = require("console");
const sharp = require("sharp");
const path = require("path");

const getProductList = async (req, res) => {
  try {
    const { sort } = req.query;
    let sortOption = {};

    switch (sort) {
      case 'popularity':
        sortOption = { popularity: -1 };
        break;
      case 'price_low_high':
        sortOption = { price: 1 };
        break;
      // Add other sorting cases as needed
      default:
        sortOption = {};
        break;
    }

    const products = await Product.find().sort(sortOption);
    res.render("user/productList", { products });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching products");
  }
};

const getAddProductForm = async (req, res) => {
  try {
    const category=await Category.find()
    console.log(category,"get addproduct c");
    res.render("admin/addProduct",{category});
  } catch (error) {
    console.log("error");
  }
};

//                               const addProduct = async (req, res) => {

//                                 try {

//                                   console.log(req.body)
//                                   const { category,productname, description, price } = req.body;
//                                   const newProduct = new Product({
//                                     name:productname,
//                                     description:description,
//                                     price:price,
//                                     category:category
//                                   });
//                                   await newProduct.save();
//                                   res.redirect("/admin/products");
//                                 } catch (error) {
//                                   console.error(error);
//                                   res.status(500).send("Error adding product");
//                                 }
//                               };
const addProduct = async (req, res) => {
  try {
    console.log("reqBody:", req.body);

    const { category, productname, description, price } = req.body;
    const imagePaths = [];
    console.log(category,"add category");
    // console.log("imagePath", imagePaths);
    // Loop through each uploaded file
    for (let i = 0; i < req.files.length; i++) {
      const originalPath = req.files[i].path;
      const imagePath = path.join(
        __dirname,
        `
        ../../../public/uploads`,
        req.files[i].filename
      );
      await sharp(originalPath)
        .resize(800, 800, { fit: "fill" })

        .toFile(imagePath);

      imagePaths[i] = req.files[i].filename;
    }
    const newProduct = new Product({
      name: productname,
      description: description,
      price: price,
      category: category,
      image: imagePaths,
    });

    await newProduct.save();
    res.redirect("/admin/viewProducts");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error adding product");
  }
};

const viewProducts = async (req, res) => {
  try {
    const category=await Category.find()
    const product = await Product.find().populate("category");
    console.log('product:',product);
    res.render("admin/viewProducts", { product,category });
  } catch (error) {}
};

const listProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    console.log("productId:", productId);
    const proData = await Product.findByIdAndUpdate(productId, {
      isListed: "false",
    });
    if (proData) {
      res.json({ success: true });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const unlistProduct = async (req, res) => {
  const productId = req.body.productId;
  console.log("line 205", productId);

  try {
    await Products.findByIdAndUpdate(productId, { status: "listed" });
    console.log("unlisted");
    res.json({ success: true });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const getEditProduct = async (req, res) => {
  try {
    const category=await Category.find()
    const id = req.params.id;
    const objectId = new mongoose.Types.ObjectId(id);
    const product = await Product.findOne({ _id: objectId });
    res.render("admin/editProduct", { product,category });
  } catch (error) {
    console.log(error);
  }
};
const editProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const updatedProductData = req.body;
    const { productname, description, category, price, stock } =
      updatedProductData;

    // Validate the incoming data
    if (!productname || !description || !category || !price || !stock) {
      return res.status(400).send("Please provide all required fields");
    }

    // Update the product in the database
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        name: productname,
        description: description,
        price: price,
        category: category,
        stock: stock,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).send("Product not found");
    }
    console.log(updatedProduct);

    res.redirect("/admin/viewroducts"); // Redirect to products page after successful update
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  getProductList,
  getAddProductForm,
  addProduct,
  editProduct,
  viewProducts,
  listProduct,
  unlistProduct,
  getEditProduct,
};
