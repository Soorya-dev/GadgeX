const express = require('express');
const router = express.Router();

// Middleware for authentication (replace with your implementation)
const adminAuth = (req, res, next) => {
    // Implement logic to check if user is logged in as admin
    // If not authorized, redirect to login page or send error response
    if (!req.isAdmin) {
        return res.status(401).send('Unauthorized access. Please login as admin.');
    }
    next();
};

// Product management routes (using 'product' instead of 'products' for clarity)
router.get('/admin/product', adminAuth, (req, res) => {
    // Logic to fetch product data from database or model
    const products = []; // Replace with your logic
    res.render('admin/productManagement', { products });
});

router.post('/admin/product/add', adminAuth, (req, res) => {
    // Logic to handle product creation (validation, saving to database)
    const newProduct = req.body; // Replace with proper product data extraction
    // ... (product creation logic)
    res.redirect('/admin/product'); // Redirect to product list after creation
});

// ... (similar routes for product editing, deletion, etc.)

// User management routes
router.get('/admin/user', adminAuth, (req, res) => {
    // Logic to fetch user data from database or model
    const users = []; // Replace with your logic
    res.render('admin/userManager', { users });
});

router.post('/admin/user/edit/:userId', adminAuth, (req, res) => {
    // Logic to handle user data editing (validation, saving to database)
    const userId = req.params.userId;
    const updatedUserData = req.body; // Replace with proper data extraction
    // ... (user update logic)
    res.redirect('/admin/user'); // Redirect to user list after edit
});

// ... (similar routes for user creation, deletion, etc.)

// Category management routes
router.get('/admin/category', adminAuth, (req, res) => {
    // Logic to fetch category data from database or model
    const categories = []; // Replace with your logic
    res.render('admin/categoryManagement', { categories });
});

router.post('/admin/category/add', adminAuth, (req, res) => {
    // Logic to handle category creation (validation, saving to database)
    const newCategory = req.body; // Replace with proper category data extraction
    // ... (category creation logic)
    res.redirect('/admin/category'); // Redirect to category list after creation
});

// ... (similar routes for category editing, deletion, etc.)

module.exports = router;

router.get('/', function(req, res, next) {
    res.render('user/login'); // Ensure this path is correct relative to your views directory
});

module.exports = router;
