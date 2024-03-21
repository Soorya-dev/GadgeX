const Product = require("../model/productModel");
const Admin = require("../model/admin");
const multer = require("multer");

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
    const imagePaths = req.files.map(file => file.filename); 
    // console.log("imagePath", imagePaths);
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



const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    // Find the product by ID and delete it
    await Product.findByIdAndDelete(productId);

    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting product");
  }
};



const editProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    // Use multer middleware to handle image upload
    const uploadResult = await upload.single("productImage")(req, res);

    if (uploadResult instanceof multer.MulterError) {
      return res.status(500).send("Error uploading image");
    } else if (uploadResult.error) {
      return res.status(400).send(uploadResult.error.message);
    }
    const { category, productname, description, price } = req.body;
    const imagePath = uploadResult.filename || ""; // Use uploaded image path if available

    // Find the product by ID and update it
    await Product.findByIdAndUpdate(productId, {
      name: productname,
      description,
      price,
      category,
      imagePath,
    });

    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error editing product");
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
      console.log('bodyyyy', req.body)
      const productId = req.body.productId
      console.log('proodid', productId)

      let proData = await Products.findByIdAndUpdate(productId, { status: 'unlisted' });
      console.log('pros', proData)
      if (proData) {
          res.json({ success: true })
      }

  } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
  }
};

const unlistProduct = async (req, res) => {
  const productId = req.body.productId
  console.log('line 205', productId)

  try {
      await Products.findByIdAndUpdate(productId, { status: 'listed' });
      console.log('unlisted');
      res.json({ success: true })
  } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
  }
};
module.exports = {
  getProductList,
  getAddProductForm,
  addProduct,
  deleteProduct,
  editProduct,
  viewProducts,
  listProduct,
  unlistProduct
};
