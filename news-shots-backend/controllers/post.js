const Post = require('../models/post')
const Category = require('../models/category')
const formidable = require('formidable')
const _ = require('lodash')
const fs = require('fs');
const fetch = require('cross-fetch');

exports.getPostByLink = (req, res, next, link) => {
    Post.findOne({'link': link}).populate("category").populate("author", "_id name").exec((err, prod) => {
        if(prod === null){
            return res.status(400).json({
                error: "Post not found"
            });
        }
        req.post = prod;
        next();
    });
};

exports.createPost = (req, res) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;

    form.parse(req, (err, fields, file) => {
        if(err){
            return res.status(400).json({
                error: "Problem with Image"
            });
        }

        const {title, description, content, category} = fields;
        if(!title || !description || !content || !category){
            return res.status(400).json({
                error: "Please Include all fields"
            });
        }

        let post = new Post(fields);
        post.author = req.profile._id;
        post.link = title.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?']/g,"").replace(/\s+/g, '-').toLowerCase();

        if(file.photo){
            if(file.photo.size > 3000000){
                return res.status(400).json({
                  error: "File size too big!"
                });
            }

            post.photo.data = fs.readFileSync(file.photo.path);
            post.photo.contentType = file.photo.type;
        }


        post.save((err, post) => {
            if(err){
                return res.status(400).json({
                    error: "Not able to save Post in DB"
                });
            }
            res.json(post);
        });

        let mailPost = new Post(fields);
        mailPost.author = req.profile._id;
        mailPost.link = title.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?']/g,"").replace(/\s+/g, '-').toLowerCase();

        fetch(`${process.env.BACKEND_API}/send/post`, {
            method: "POST",
            body: JSON.stringify(mailPost),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
        .then(response => {
            return response.json();
        })
        .catch(err => console.log(err));

    });
};

exports.getPost = (req, res) => {
    req.post.photo = undefined;
    return res.json(req.post);
};

exports.photo = (req, res, next) => {
    if(req.post.photo.data){
        res.set("Content-Type", req.post.photo.contentType);
        return res.send(req.post.photo.data)
    }
    next();
};

exports.deletePost =(req, res) => {
    let post = req.post;
    post.remove((err, deletedPost) => {
        if(err){
            return res.status(400).json({
                error: "Failed to delete Post"
            });
        }
        res.json({
            message: "Deletion was success",
            deletedPost
        });
    });
};

exports.updatePost = (req, res) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;

    form.parse(req, (err, fields, file) => {
        if(err){
            return res.status(400).json({
                error: "Problem with Image"
            });
        }

        let post = req.post;
        post = _.extend(post, fields)
        post.link = post.title.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?']/g,"").replace(/\s+/g, '-').toLowerCase();

        if(file.photo){
            if(file.photo.size > 3000000){
                return res.status(400).json({
                  error: "File size too big!"
                });
            }
            post.photo.data = fs.readFileSync(file.photo.path);  //using file path
            post.photo.contentType = file.photo.type;
        }

        post.save((err, post) => {
            if(err){
                return res.status(400).json({
                    error: "Updation of post failed"
                });
            }
            res.json(post);
        });
    });
};

exports.getAllPosts = (req, res) => {
    let limit = req.query.limit ? parseInt(req.query.limit) : 1000000;

    let sortBy = req.query.sortBy ? req.query.sortBy : '_id';

    Post.find()
        .select("-photo")
        .select("-content")
        .populate('category')
        .populate("author", "_id name")
        .sort([[sortBy, 'descending']])
        .limit(limit)
        .exec((err, posts) => {
        if(err){
            return res.status(400).json({
                error: "No Post was Found"
            });
        }
        res.json(posts);
    });
};

// distinct with populate
exports.getAllUniqueCategories = (req, res) => {
    Post.distinct("category", {}, (err, category_id) => {
        Category.find({'_id': category_id}, (err, category) => {
            if(err){
                return res.status(400).json({
                    error: "No Category Found"
                });
            }
            res.json(category);
        });
    });
}

exports.getAllCategoryPosts = (req, res) => {

    Post.find({ "category": req.category._id} )
        .select("-photo")
        .select("-content")
        .populate('category')
        .populate("author", "_id name")
        .sort([['createdAt', 'descending']])
        .exec((err, posts) => {
        if(err){
            return res.status(400).json({
                error: "No Post was Found"
            });
        }
        res.json(posts);
    });
};

exports.getCategoryPostCount = (req, res) => {
    Post.find({ "category": req.category._id} )
        .countDocuments({}, function(err, count){
        if(err){
            return res.status(400).json({
                error: "Error in Counting Posts"
            });
        }
        res.json(count);
    });
}

exports.getCategoryPostsByIndex = (req, res) => {
    let limit = req.query.limit ? parseInt(req.query.limit) : 1000000;
    let skip = req.query.skip ? parseInt(req.query.skip) : 0;

    Post.find({ 'category': req.category._id}, {createdAt: 1, title:1, description:1, link:1})
        .populate('category')
        .populate("author", "_id name")
        .sort([['createdAt', 'descending']])
        .skip(skip)
        .limit(limit)
        .exec((err, posts) => {
        if(err){
            return res.status(400).json({
                error: "No Post was Found"
            });
        }
        res.json(posts);
    })
}

exports.getPostCount = (req, res) => {
    Post.countDocuments({}, function(err, count){
        if(err){
            return res.status(400).json({
                error: "Error in Counting Posts"
            });
        }
        res.json(count);
    });
}

exports.getPostsByIndex = (req, res) => {
    let limit = req.query.limit ? parseInt(req.query.limit) : 1000000;
    let skip = req.query.skip ? parseInt(req.query.skip) : 0;

    Post.find({}, {createdAt: 1, title:1, description:1, link:1})
        .populate('category')
        .populate("author", "_id name")
        .sort([['createdAt', 'descending']])
        .skip(skip)
        .limit(limit)
        .exec((err, posts) => {
        if(err){
            return res.status(400).json({
                error: "No Post was Found"
            });
        }
        res.json(posts);
    })
}

// used only for backward or forward pagination, not for any specific page
// https://stackoverflow.com/a/7230040/12685377
exports.getPostsByCreated = (req, res) => {

    let limit = req.query.limit ? parseInt(req.query.limit) : 1000000;
    let last_result_date = req.query.last_result_date ? req.query.last_result_date : new Date();

    Post.find({createdAt : { $lt : last_result_date }}, {createdAt: 1, title:1, description:1, link:1})
        .sort({createdAt:-1})
        .limit(10)
        .exec((err, posts) => {
        if(err){
            return res.status(400).json({
                error: "No Post was Found"
            });
        }
        res.json(posts)
    });
}

// Search
exports.getPostRegex = (req, res) => {
    let search = req.query.search ? req.query.search : "";

    Post.find({ "title" : { $regex: `${search}`, $options: 'i'}})
        .select("-photo")
        .select("-content")
        .populate('category')
        .populate("author", "_id name")
        .sort([['createdAt', 'descending']])
        .limit(5)
        .exec((err, posts) => {
        if(err){
            return res.status(400).json({
                error: "No Posts Found"
            });
        }
        res.json(posts);
    });
}
