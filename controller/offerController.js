const mongoose = require('mongoose')
const Coupon =require("../model/couponModel")
const Order = require('../model/order');
const Cart = require('../model/cartModel');
const Product = require("../model/productModel");
const User = require("../model/userModel");
const Category = require('../model/categoryModel');
const Offer=require('../model/offerModel')

const loadOffer = async (req, res) => {
    try {
        const offerData = await Offer.find({})
        // console.log('offerData', offerData, 'offerData');
        res.render('admin/offer', {activeOfferPage: "Active", offerData})
    } catch (error) {
        console.error('Error in loadOffer:', error);
        res.status(500).send('Internal Server Error');
    }
}


  

const addOffer = async (req, res) => {
    try {
        const { offerName, percentage, offerExpired,offerType } = req.body;

  

        const existOfferName = await Offer.findOne({name:offerName})

        if(existOfferName){
            return res.status(400).send({error:'The offer name is already used'})
        }

        if (!offerName || !percentage || !offerExpired) {
            return res.status(400).send({ error: 'All fields are required' });
        }

        if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
            return res.status(400).send({ error: 'Percentage must be a number between 1 and 100' });
        }

        const currentDate = new Date().toISOString().split('T')[0];
        if (!offerExpired || new Date(offerExpired) < new Date(currentDate)) {
            return res.status(400).json({ error: 'Offer expiration date should not be in the past.' });
        }

        // creating the offer
        const offer = new Offer({ 
            type:offerType,
            name: offerName, 
            percentage: percentage, 
            expireDate: offerExpired
        });

        await offer.save();

        // console.log('offer',offer,'hellooooooooooo soooooooooooooryaaaaaaaaa');

        res.status(200).send({ message: 'Offer created successfully' });
    } catch (error) {
        console.error(error);  
        res.status(500).send({ error: 'Internal server error' });
    }
};

const deleteOffer = async (req, res) => {
    try {
      const { offerId } = req.query;
  
      // Remove offer from products
      await Product.updateMany(
        { 'offerDetails.offerId': offerId },
        { $set: { offerApplied: false }, $unset: { offerDetails: "" } }
      );
  
      // Remove offer from categories
      await Category.updateMany(
        { 'offerDetails.offerId': offerId },
        { $set: { offerApplied: false }, $unset: { offerDetails: "" } }
      );
  
      // Delete the offer
      await Offer.findOneAndDelete({ _id: offerId });
  
      return res.redirect('/admin/offer');
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
  };

// show offer in product listing page 

const getOffer = async (req, res)=>{
    const getOffer = async (req, res) => {
        try {
            const offers = await Offer.find({ type: 'product' });
            res.json(offers);
        } catch (error) {
            console.log(error.message);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

const applyOffer = async (req, res) => {
    try {
        const { productId, offerId } = req.body;
        console.log('Applying offer with ID:', offerId, 'to product with ID:', productId);

        // Fetch the offer
        const offer = await Offer.findById(offerId);
        if (!offer) {
            console.log('Offer not found');
            return res.status(404).json({ error: 'Offer not found' });
        }
        // console.log('Offer found:', offer);

        // Fetch the product
        const product = await Product.findById(productId);
        if (!product) {
            console.log('Product not found');
            return res.status(404).json({ error: 'Product not found' });
        }
        // console.log('Product found:', product);

        // Calculate the discount and the new price
        const discountAmount = product.price * (offer.percentage / 100);
        const priceAfterOffer = product.price - discountAmount;

        // Update the product
        product.offerApplied = true;
        product.offerDetails = {
            offerId: offer._id,
            priceAfterOfferApplied: priceAfterOffer,
            offerPercentage: offer.percentage
        };
        // console.log('Updated product:', product);

        // Save the updated product
        await product.save();
        console.log('Product saved successfully');

        res.status(200).json({ message: 'Offer Applied Successfully' });
    } catch (error) {
        console.error('Error applying offer:', error);
        res.status(500).json({ error: 'Server Error', details: error.message });
    }
};




const applyOfferToProduct = async (req, res) => {
    try {
        const { productId, offerId } = req.params;

        const offer = await Offer.findById(offerId);
        if (!offer) {
            return res.status(404).json({ success: false, error: 'Offer not found' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        if (product.offerApplied) {
            return res.status(400).json({ success: false, error: 'An offer is already applied to this product' });
        }

        const discountAmount = product.price * (offer.percentage / 100);
        const priceAfterOffer = product.price - discountAmount;

        product.offerApplied = true;
        product.offerDetails = {
            offerId: offer._id,
            priceAfterOfferApplied: priceAfterOffer,
            offerPercentage: offer.percentage
        };

        await product.save();

        offer.offerUsed.push({ productId });
        await offer.save();

        res.json({ success: true, message: 'Offer applied successfully' });
    } catch (error) {
        console.error('Error applying offer to product:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};


const getOffersForProduct = async (req, res) => {
    try {
        const { productId } = req.params;
     
        const offers = await Offer.find({ type: 'product' });
        res.json(offers);
    } catch (error) {
        console.error('Error fetching offers for product:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

const getOffersForCategory = async (req, res) => {
    try {
        const offers = await Offer.find({ type: 'category' });
        res.json(offers);
    } catch (error) {
        console.error('Error fetching offers for category:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// Apply offer to all products in a category
const applyCategoryOffer = async (req, res) => {
    try {
        const { categoryId, offerId } = req.body;

        // Validate the offer
        const offer = await Offer.findById(offerId);
        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        // Validate the category
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Apply the offer to the category
        category.offerApplied = true;
        category.offerDetails = {
            offerId: offer._id,
            offerPercentage: offer.percentage
        };
        await category.save();

        // Apply the offer to all products in this category
        const products = await Product.find({ category: categoryId });
        products.forEach(async (product) => {
            const discountAmount = product.price * (offer.percentage / 100);
            const priceAfterOffer = product.price - discountAmount;

            product.offerApplied = true;
            product.offerDetails = {
                offerId: offer._id,
                priceAfterOfferApplied: priceAfterOffer,
                offerPercentage: offer.percentage
            };
            await product.save();
        });

        res.json({ message: 'Offer applied successfully to category and all its products' });
    } catch (error) {
        console.error('Error applying offer to category:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};
const removeExpiredOffers = async () => {
    try {
      const currentDate = new Date();
      const expiredOffers = await Offer.find({ expireDate: { $lt: currentDate } });
  
      for (const offer of expiredOffers) {
        // Remove offer from products
        await Product.updateMany(
          { 'offerDetails.offerId': offer._id },
          { $set: { offerApplied: false }, $unset: { offerDetails: "" } }
        );
  
        // Remove offer from categories
        await Category.updateMany(
          { 'offerDetails.offerId': offer._id },
          { $set: { offerApplied: false }, $unset: { offerDetails: "" } }
        );
  
        // Delete the expired offer
        await Offer.findByIdAndDelete(offer._id);
      }
    } catch (error) {
      console.error('Error removing expired offers:', error);
    }
  };
module.exports = {
    loadOffer,
    addOffer,
    deleteOffer,
    getOffer,
    applyOffer,
    getOffersForProduct,
    applyOfferToProduct,
    applyCategoryOffer,
    getOffersForCategory,
    removeExpiredOffers

   
}