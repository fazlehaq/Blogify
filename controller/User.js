const UserServices = require("../services/User");
const Blog = require("../models/Blog");
const Comment = require("../models/Comment");
const ErrorClasses = require("../errorClasses");


async function getUserProfile(req, res, next) {
    const { userId } = req.params;
    const ERROR_MESSAGE = "Error Occured While Fetching Data !";

    try {

        const queries = [
            UserServices.getUserData(userId),
            Comment.getTotalCommentsWritten(userId),
            Blog.getTotalBlogsPosted(userId),
            Comment.getRecentUserComments(userId)
        ]

        const [userData, commentsWritten, blogsPosted] = await Promise.allSettled(queries);

        const response = {
            userData: userData.status == "fulfilled" ? userData.value : null,
            commentsWritten: commentsWritten.status == "fulfilled" ? commentsWritten.value : null,
            blogsPosted: blogsPosted.status == "fulfilled" ? blogsPosted.value : null,
            tagsFollowed: userData.interests,
            errors: {
                userData: userData.status == "rejected" ? ERROR_MESSAGE : null,
                commentsWritten: commentsWritten.status == "rejected" ? ERROR_MESSAGE : null,
                blogsPosted: blogsPosted.status == "rejected" ? ERROR_MESSAGE : null,
            },
        };

        return res.json({ response });

    } catch (error) {
        next(error);
    }
}

async function getTotalCommentsWritten(req, res, next) {
    const { userId } = req.params;
    try {
        const totalComments = await Comment.getTotalCommentsWritten(userId);
        if (!totalComments) return ErrorClasses.InvalidInputError('Invalid User Id');

        return res.json({ totalComments });
    } catch (error) {
        next(error);
    }
}

async function getTotalBlogsPosted(req, res, next) {
    const { userId } = req.params;
    try {
        const totalPosts = await Blog.getTotalBlogsPosted({ id: userId });
        if (!totalPosts) return ErrorClasses.InvalidInputError('Invalid User Id');
        return res.json({ totalPosts });
    } catch (error) {
        next(error);
    }
}

module.exports = { getUserProfile, getTotalCommentsWritten, getTotalBlogsPosted };