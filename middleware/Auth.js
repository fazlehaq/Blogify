const Comment = require("../models/Comment");
const Blog = require("../models/Blog");
const Follow = require("../models/Follow")
const ErrorClasses = require("../errorClasses");

const MODELS = {
    "Comment": Comment,
    "Blog": Blog,
    "Follow": Follow
}

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        return next();
    else {
        console.log(req.cookies)
        throw new ErrorClasses.AuthenticationRequiredError();
    }
}

function authorAccessOnly(modelName) {
    return async function (req, res, next) {
        const docId = req.params[0];
        const userId = req.user.data._id;
        const MODEL = MODELS[modelName];

        try {
            const isAuthorized = await MODEL.exists({ _id: docId, author: userId });
            if (isAuthorized == null)
                throw new ErrorClasses.AccessForbiddenError();
            return next();
        } catch (error) {
            next(error)
        }
    }
}

module.exports = { ensureAuthenticated, authorAccessOnly }
