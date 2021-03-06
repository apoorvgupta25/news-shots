const Category = require('../models/category')

exports.getCategoryByName = (req, res, next, name) => {

    Category.findOne({'name': name}).exec((err, categ) => {
        if(categ == null){
            return res.status(400).json({
                error: "Category not found in db"
            });
        }
        req.category = categ;
        next();
    });
};

exports.createCategory = (req, res) => {
    const category = new Category(req.body);
    category.save((err, category) => {
        if(err){
            return res.status(400).json({
                error: "Not able to save the Category in db"
            });
        }
        res.json({category});
    });
};

exports.getCategory = (req, res) => {
    return res.json(req.category);
};

exports.getAllCategory = (req, res) => {
    Category.find().exec((err, categories) => {
        if(err){
            return res.status(400).json({
                error: "No Category Found"
            });
        }
        res.json(categories);
    });
};

exports.updateCategory = (req, res) => {
    const category = req.category;
    category.name = req.body.name;

    category.save((err, updatedCategory) => {
        if(err){
            return res.status(400).json({
                error: "Not able to update Category in db"
            });
        }
        res.json(updatedCategory);
    });
};

exports.removeCategory = (req, res) => {
    const category = req.category;

    category.remove((err, deletedCategory) => {
        if(err){
            return res.status(400).json({
                error: "Not able to delete Category"
            });
        }
        res.json({
            message: `Cateogry Deleted ${deletedCategory.name}`
        });
    });
};
