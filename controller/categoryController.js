const Category = require('../model/categoryModel');


const getCategoryController=async(req,res)=>{
    try {
        const category=await Category.find()
        console.log('cat:',category)
        res.render('admin/categories',{category})
        
    } catch (error) {
        console.log(error.message)
        
    }
}
const createCategory = async (req, res) => {
    try {
        console.log('iam reqbduf', req.body);
        // Extract data from request body
        const { product_name, description } = req.body;

        // Create a new instance of Category model
        const newCategory = new Category({
            name: product_name,
            description: description
        });

        // Save the new category to the database
        const savedCategory = await newCategory.save();

        // Redirect the client to '/admin/create-category' after successfully creating the category
        res.redirect('/admin/categories');
    } catch (error) {
        console.log(error.message);
        // Handle errors
        res.status(500).json({ error: 'Failed to create category' });
    }
};

module.exports={
    getCategoryController,
    createCategory
}