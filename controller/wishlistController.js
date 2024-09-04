const Products = require("../model/productModel");
const User = require("../model/userModel");
const Order = require("../model/order");
const Address = require("../model/addressModel");
const Category = require("../model/categoryModel");
const Wishlist = require("../model/wishlistModel");
const Cart =require("../model/cartModel")

const loadWishlist = async (req, res) => {
    try {
      const userId = req.session.user_id;
      if (!userId) {
        return res.redirect('/login');
      }
  
      const wishlistData = await Wishlist.findOne({ userId })
        .populate('products.productId')
        .populate('products.category');
  
      const categories = await Category.find();
  
      // Fetch the user's cart
      const cart = await Cart.findOne({ user: userId })
        .populate('product.productId')
        .exec();
  
      res.render('./user/wishlist', { wishlistData, user: userId, categories, cart });
    } catch (error) {
      console.log(error);
    }
  };

const addToWishlist = async (req, res) => {
    const { productId, categoryId } = req.body;
    const userId = req.session.user_id;

    if (!productId || !categoryId) {
        return res.status(400).json({ success: false, error: 'Product ID and Category ID are required.' });
    }

    try {
        let wishlist = await Wishlist.findOne({ userId });

        if (wishlist) {
            // Check if product already exists in wishlist
            const productExists = wishlist.products.some(product => product.productId.equals(productId));

            if (productExists) {
                return res.json({ success: false, error: 'Product already in wishlist' });
            } else {
                wishlist.products.push({ productId, category: categoryId });
            }
        } else {
            // Create a new wishlist for the user
            wishlist = new Wishlist({
                userId,
                products: [{ productId, category: categoryId }]
            });
        }

        await wishlist.save();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'An error occurred while adding to wishlist' });
    }
};


const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const { productId } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'User not logged in' });
        }

        const wishlist = await Wishlist.findOne({ userId });

        if (wishlist) {
            wishlist.products = wishlist.products.filter(product => product.productId.toString() !== productId);
            await wishlist.save();
        }

        res.json({ message: 'Product removed from wishlist' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'An error occurred' });
    }
};

module.exports = {
    loadWishlist,
    addToWishlist,
    removeFromWishlist
};