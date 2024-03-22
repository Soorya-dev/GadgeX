const Product = require("../model/productModel");
const Admin = require("../model/admin");
const multer = require("multer");
const mongoose = require("mongoose");
const { log } = require("console");
const sharp = require("sharp");
const path = require("path");

const getProductList = async (req, res) => {
  try {
    const products = await Product.find();
    res.render("admin/productList", { products });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching products");
  }
};

const getAddProductForm = (req, res) => {
  try {
    res.render("admin/addProduct");
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
    // console.log("reqBody:", req.body);

    const { category, productname, description, price } = req.body;
    const imagePaths = [];
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

      imagePaths[i]=req.files[i].filename;
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
    const product = await Product.find({});
    // console.log('product:',product);
    res.render("admin/viewProducts", { product });
  } catch (error) {}
};
const listProduct = async (req, res) => {
  try {
    console.log("bodyyyy", req.body);
    const productId = req.body.productId;
    console.log("proodid", productId);

    let proData = await Products.findByIdAndUpdate(productId, {
      status: "unlisted",
    });
    console.log("pros", proData);
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
    const id = req.params.id;
    const objectId = new mongoose.Types.ObjectId(id);
    const product = await Product.findOne({ _id: objectId });
    res.render("admin/editProduct", { product });
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

    res.redirect("/admin/products"); // Redirect to products page after successful update
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
