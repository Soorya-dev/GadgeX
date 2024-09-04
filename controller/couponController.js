const mongoose = require("mongoose");
const Coupon = require("../model/couponModel");
const Order = require("../model/order");
const Cart = require("../model/cartModel");

const loadCoupon = async (req, res) => {
  try {
    const couponData = await Coupon.find({});
    res.render("admin/coupon", {
      activeCouponMessage: "active",
      coupons: couponData,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const checkCouponCode = async (req, res) => {
  try {
    const { couponCode } = req.body;

    const existingCoupon = await Coupon.findOne({ couponCode });

    return res.status(200).json({ exists: !!existingCoupon });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const addCoupon = async (req, res) => {
  try {
    const { couponName, couponCode, couponAmount, couponExpired, minAmount } = req.body;

    // Validate coupon name
    if (!couponName || typeof couponName !== "string" || couponName.trim() === "") {
      return res.status(400).json({ success: false, message: "Coupon name is required and should be a non-empty string." });
    }

    // Validate coupon code
    if (!couponCode || !/^[a-zA-Z0-9]+$/.test(couponCode)) {
      return res.status(400).json({ success: false, message: "Coupon code should be alphanumeric." });
    }

    // Check for existing coupon code
    const existingCoupon = await Coupon.findOne({ couponCode });
    if (existingCoupon) {
      return res.status(400).json({ success: false, message: "Coupon code is already in use." });
    }

    // Validate coupon amount
    if (!couponAmount || isNaN(couponAmount) || parseFloat(couponAmount) <= 0) {
      return res.status(400).json({ success: false, message: "Coupon amount should be a positive number." });
    }

    // Validate minimum amount
    if (!minAmount || isNaN(minAmount) || parseFloat(minAmount) <= 0) {
      return res.status(400).json({ success: false, message: "Minimum amount should be a positive number." });
    }

    // Validate expiration date
    const currentDate = new Date();
    const expirationDate = new Date(couponExpired);
    if (!couponExpired || isNaN(expirationDate.getTime()) || expirationDate < currentDate) {
      return res.status(400).json({ success: false, message: "Coupon expiration date should be a valid future date." });
    }

    const coupon = new Coupon({
      name: couponName,
      amount: parseFloat(couponAmount),
      couponCode,
      expired: expirationDate,
      minimumAmount: parseFloat(minAmount),
    });

    await coupon.save();

    res.status(201).json({ success: true, message: "Coupon created successfully!" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    await Coupon.findByIdAndDelete(couponId);
    res.redirect("/admin/coupon");
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const applyCoupon = async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID not found in session" });
    }

    const { couponCode, cartTotal } = req.body;
    const coupon = await Coupon.findOne({ couponCode });
``


    if (!coupon) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid coupon" });
    }

    const currentDate = new Date();
    if (currentDate > coupon.expired) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon has expired" });
    }

    if (cartTotal < coupon.minimumAmount) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Minimum cart total of ₹${coupon.minimumAmount} required to apply this coupon`,
        });
    }

    const userCouponUsed = coupon.usersList.some((userCoupon) =>
      userCoupon.userId.equals(userId)
    );
    if (userCouponUsed) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon already used" });
    }

    const discount = coupon.amount;
    const newCartTotal = cartTotal - discount;

    const cartData = await Cart.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          oldTotal: cartTotal,
          subtotal: newCartTotal,
          discount,
        },
      },
      { new: true }
    );

    req.session.discount = discount;

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully!",
      cartTotal: newCartTotal,
      discount,
    });
  } catch (error) {
    console.error(error.message);
    return res
      .status(500)
      .json({
        success: false,
        message: "An error occurred. Please try again later.",
      });
  }
};

const removeCoupon = async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    const cartData = await Cart.findOneAndUpdate(
      { user: userId },
      [
        {
          $set: {
            subtotal: "$oldTotal", // Update subtotal with the value of oldTotal
            discount: 0
          }
        }
      ],
      { new: true }
    );
    

    return res.status(200).json({
      success: true,
      message: "Coupon removed successfully!",
    });
  } catch (error) {
    console.error("Error removing coupon:uguioiug", error.message);
    return res
      .status(500)
      .json({
        success: false,
        message: "An error occurred. Please try again later.",
      });
  }
};

const getCoupon = async (req, res) => {
  try {
      const couponId = req.params.id;
      const coupon = await Coupon.findById(couponId);
      if (!coupon) {
          return res.status(404).json({ success: false, message: "Coupon not found" });
      }
      res.json({ success: true, coupon });
  } catch (error) {
      console.error(error.message);
      res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateCoupon = async (req, res) => {
  try {
      const couponId = req.params.id; // Make sure you're getting the ID from the request params
      const { couponName, couponCode, couponAmount, couponExpired, minAmount } = req.body;

      // Validate coupon name
      if (!couponName || typeof couponName !== "string" || couponName.trim() === "") {
          return res.status(400).json({ success: false, message: "Coupon name is required and should be a non-empty string." });
      }

      // Validate coupon code
      if (!couponCode || !/^[a-zA-Z0-9]+$/.test(couponCode)) {
          return res.status(400).json({ success: false, message: "Coupon code should be alphanumeric." });
      }

      // Check for existing coupon code, excluding the current coupon
      const existingCoupon = await Coupon.findOne({ couponCode, _id: { $ne: couponId } });
      if (existingCoupon) {
          return res.status(400).json({ success: false, message: "Coupon code is already in use." });
      }

      // Rest of your validation logic...

      const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, {
          name: couponName,
          amount: parseFloat(couponAmount),
          couponCode,
          expired: new Date(couponExpired),
          minimumAmount: parseFloat(minAmount),
      }, { new: true });

      if (!updatedCoupon) {
          return res.status(404).json({ success: false, message: "Coupon not found" });
      }

      res.status(200).json({ success: true, message: "Coupon updated successfully!" });
  } catch (error) {
      console.error(error.message);
      res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  loadCoupon,
  checkCouponCode,
  addCoupon,
  deleteCoupon,
  applyCoupon,
  removeCoupon,
  updateCoupon,
  getCoupon
};
