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
const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        await Category.findByIdAndDelete(categoryId);
        res.redirect('/admin/addcategory'); 
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

// Load the edit category form
const loadEditCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const category = await Category.findById(categoryId);
        const userData = await User.findById({ _id: req.session.admin_id });

        if (!category) {
            return res.status(404).send('Category not found');
        }

        res.render('admin/edit-category', { category:category, user:userData });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const editCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const { newName, newDescription } = req.body;
        // await Category.findByIdAndUpdate(categoryId, { name: newName, description: newDescription });
        await Category.findByIdAndUpdate(categoryId, { $set: { name: newName, description: newDescription } });


        res.redirect('/admin/addcategory'); // Redirect to the product page or category page
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const unlistCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        await Category.findByIdAndUpdate(categoryId, { status: 'unlisted' }, { new: true });
        res.redirect('/admin/addcategory');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const listCategory = async (req, res) => {
    const categoryId = req.params.categoryId;
    try {
        await Category.findByIdAndUpdate(categoryId, { status: 'listed' }, { new: true });
        res.redirect('/admin/addcategory')
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};
module.exports={
    getCategoryController,
    createCategory,
    listCategory,
    unlistCategory,
    editCategory,
    loadEditCategory
}