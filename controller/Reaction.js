const Reaction = require('../models/Reaction');
const { REACTIONS_OPERATIONS } = require("../models/Reaction");
const Blog = require('../models/Blog');
const ErrorClasses = require('../errorClasses');


async function getReaction(req, res, next) {
    const { blogId } = req.params;
    const userId = req.user.data._id;
    try {
        const userReaction = await Reaction.getReaction({ userId, blogId });
        if (!userReaction) throw new ErrorClasses.ResourceNotFoundError("User Has No Reaction");

        return res.json({
            msg: `User has ${userReaction.type} the blog`,
            reaction: userReaction.type
        });
    } catch (error) {
        next(error);
    }
}

async function toggleLike(req, res, next) {
    const { blogId } = req.params;
    const userId = req.user.data._id;

    try {
        const userReaction = await Reaction.getReaction({ userId, blogId });
        let operation;

        if (!userReaction) {
            await Reaction.addReaction({ userId, blogId, type: 'like' });
            res.status(201).json({ msg: 'Liked the blog' })
            operation = REACTIONS_OPERATIONS.like
        }

        else {
            const reaction = userReaction.type;

            // unlike
            if (reaction == 'like') {
                await Reaction.deleteReaction({ userId, blogId });
                operation = REACTIONS_OPERATIONS.unlike;
            }

            // dislike
            if (reaction == 'dislike') {
                userReaction.type = 'like';
                await userReaction.save();
                operation = REACTIONS_OPERATIONS.disLikeToLike;
            }

            res.json({ msg: reaction == 'like' ? `Unliked the blog` : `Liked the blog` });
        }

        // get blog and update it 
        const blog = await Blog.getBlogById({ blogId, visibleOnly: true });
        await Reaction.updateReactions({ blog, operation });
        return;

    } catch (error) {
        next(error);
    }
}

async function toggleDisLike(req, res, next) {

    const { blogId } = req.params;
    const userId = req.user.data._id;

    try {
        const userReaction = await Reaction.getReaction({ userId, blogId });
        let operation = null;

        if (!userReaction) {
            await Reaction.addReaction({ userId, blogId, type: 'dislike' });
            operation = REACTIONS_OPERATIONS.disLike;
            res.status(201).json({ msg: `Disliked the blog` });
        }

        else {
            const reaction = userReaction.type;

            // unDisLike
            if (reaction == 'dislike') {
                await Reaction.deleteReaction({ userId, blogId });
                operation = REACTIONS_OPERATIONS.unDisLike;
            }

            if (reaction == 'like') {
                userReaction.type = 'dislike';
                await userReaction.save();
                operation = REACTIONS_OPERATIONS.likeToDislike;
            }

            res.json({ msg: reaction == 'dislike' ? `Undisliked the blog` : `Disliked the blog` });
        }
        const blog = await Blog.getBlogById({ blogId, visibleOnly: true });
        await Reaction.updateReactions({ blog, operation });
        return;

    } catch (error) {
        console.error(error.message);
        next(error);
    }
}

async function getLikes(req, res, next) {
    const { blogId } = req.params;

    try {
        const blog = await Blog.getBlogById({ blogId, visibleOnly: true });
        if (!blog) throw new ErrorClasses.ResourceNotFoundError("No Blog Found");

        const likes = await Reaction.getReactions({ blogId, type: 'like' })
        if (likes.length == 0) return res.json({ msg: "No Likes" });

        return res.json({ likes });

    } catch (error) {
        next(error)
    }
}

async function getDisLikes(req, res, next) {
    const { blogId } = req.params;

    try {
        const blog = await Blog.getBlogById({ blogId, visibleOnly: true });
        if (!blog) throw new ErrorClasses.ResourceNotFoundError("No Blog Found");

        const disLikes = await Reaction.getReactions({ blogId, type: 'dislike' })
        if (disLikes.lenght == 0) return res.json({ msg: "No disLikes" })
        return res.json({ disLikes });
    } catch (error) {
        next(error)
    }
}


module.exports = { toggleLike, toggleDisLike, getLikes, getDisLikes, getReaction }