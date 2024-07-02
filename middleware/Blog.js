const Blog = require('../models/Blog');
const ErrorClasses = require("../errorClasses");
const commonUtils = require("../utils/commonUtils");

function filterUpdateFields(req, res, next) {
    const Allowed = ['title', 'snippet', 'body', 'tagIds', 'saveAsDraft', 'sheduledAt'];
    const updates = req.body;
    for (property in updates) {
        if (!Allowed.includes(property))
            delete updates[property];
    }

    req.updates = updates

    next();
}

function filterBlogFields(req, res, next) {
    console.log(req.body)

    const NOT_ALLOWED = ['slug', 'updatedAt', 'createdAt', 'viewCount', 'likes', 'likesCount', 'author'];

    const { coverImage, ...blog } = req.body


    for (property in blog) {
        if (NOT_ALLOWED.includes(property)) {
            delete blog[property];
        }
    }

    req.blog = blog;
    next();
}

// This middleware should be used before routes which uses blogId in the model but dont access the actual blog 
async function isBlogExists(req, res, next) {
    const { blogId } = req.params || req.body;

    try {
        const isExists = await Blog.exists({ _id: blogId, sheduledAt: { $lte: new Date() }, saveAsDraft: false })
        if (isExists == null) throw new ErrorClasses.InvalidInputError('Invalid Blog Id');

        return next();
    } catch (error) {
        console.error(error.message);
        next(error);
    }
}

const validateBlogId = commonUtils.validateMongooseId("blogId");

module.exports = { filterUpdateFields, filterBlogFields, isBlogExists, validateBlogId };