const Product = require("../model/productModel");
const Category = require("../model/categoryModel");
const Admin = require("../model/admin");
const multer = require("multer");
const mongoose = require("mongoose");
const { log } = require("console");
const sharp = require("sharp");
const path = require("path");
const Offer=require('../model/offerModel')

const getProductList = async (req, res) => {
  try {
    const offerData = await Offer.find({ type: 'product' }); // Only fetch product offers
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
    res.render("user/productList", { products, offerData });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching products");
  }
};

const getAddProductForm = async (req, res) => {
  try {
    const category=await Category.find()
   
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
    const { category, productname, description, price, stock } = req.body;

    if (!productname || productname.length < 3) {
      return res.status(400).json({ success: false, message: "Product name must be at least 3 characters long." });
    }

    if (!description || description.length < 10) {
      return res.status(400).json({ success: false, message: "Description must be at least 10 characters long." });
    }

    if (!category) {
      return res.status(400).json({ success: false, message: "Category is required." });
    }

    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ success: false, message: "Price must be a positive number." });
    }

    if (isNaN(stock) || stock < 0) {
      return res.status(400).json({ success: false, message: "Stock cannot be negative." });
    }

    // Proceed with saving the product
    const imagePaths = [];
    for (let i = 0; i < req.files.length; i++) {
      const originalPath = req.files[i].path;
      const imagePath = path.join(__dirname, '../public/uploads', req.files[i].filename);
      console.log('Hellondkfjslfhjsdljfsljf 1')
      await sharp(originalPath).resize(800, 800, { fit: "fill" }).toFile(imagePath);
      console.log('Hellondkfjslfhjsdljfsljf 2')
      imagePaths[i] = req.files[i].filename;
    }

    const newProduct = new Product({
      name: productname,
      description,
      price,
      category,
      image: imagePaths,
      stock,
    });

    const savedProduct = await newProduct.save();
    res.json({ success: true, data: savedProduct });
    
  } catch (error) {
    console.error(error);
    res.status(500).send("Error adding product");
  }
};




const viewProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find().populate("category").limit(limit).skip(skip);

    res.render("admin/viewProducts", { 
      products, 
      currentPage: page, 
      totalPages 
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};



const listProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    await Product.findByIdAndUpdate(productId, { isListed: true }); // Ensure the status is set to true
    res.redirect("/admin/viewProducts"); // Redirect after updating
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const unlistProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    await Product.findByIdAndUpdate(productId, { isListed: false }); // Ensure the status is set to false
    res.redirect("/admin/viewProducts"); // Redirect after updating
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


    res.redirect("/admin/viewProducts"); // Redirect to products page after successful update
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
