const Category = require('../model/categoryModel');


const getCategoryController=async(req,res)=>{
    try {
        const category=await Category.find()
        // console.log('cat:',category)
        res.render('admin/categories',{category})
        
    } catch (error) {
        console.log(error.message)
        
    }
}
const createCategory = async (req, res) => {
    try {
        // console.log('iam reqbduf', req.body);
        // Extract data from request body
        const { product_name, description } = req.body;

        // Create a new instance of Category model
        const newCategory = new Category({
            name: product_name,
            description: description
        });

        const savedCategory = await newCategory.save();

        res.redirect('/admin/categories');
    } catch (error) {
        console.log(error.message);
        // Handle errors
        res.status(500).json({ error: 'Failed to create category' });
    }
};
const deleteCategory = async (req, res) => {
    try {
        const categoryId =req.params.categoryId;
        await Category.findByIdAndDelete(categoryId);
        res.redirect('/admin/categories'); 
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const editCategory = async (req, res) => {
    try {
        const { id } = req.params;
      
        const category = await Category.findById(id);
        res.render("admin/editCategory", { category }); 
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const updateCategory = async (req, res) => {
    try {
      
      const categoryId = req.params.id;
    
      let existData = await Category.findOne({ _id: categoryId });
   
      if (existData) {
  
      
        const {Name,Description,is_list}=req.body

        const updatedCategory = await Category.findByIdAndUpdate(categoryId,
          {
            name:Name,
            description:Description,
          },
        
          { new: true }
        );
          

        res.redirect("/admin/categories");
      } else {
        console.log('edited');
        // req.flash("error", "already existing category");
        // res.redirect(`/editCategory/${categoryId}`);
      }
    } catch (error) {
      console.error("updateil aanu error", error);
    }
  };

  const unlistCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        await Category.findByIdAndUpdate(categoryId, { isListed: false }, { new: true });
        res.sendStatus(200);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const listCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        await Category.findByIdAndUpdate(categoryId, { isListed: true }, { new: true });
        res.sendStatus(200);
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
    updateCategory,
    deleteCategory
}