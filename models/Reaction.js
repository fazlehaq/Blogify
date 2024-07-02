const mongoose = require('mongoose');
const REACTIONS_OPERATIONS = {
    disLikeToLike: 'dislike to like',
    like: 'like',
    unlike: 'unlike',
    likeToDislike: 'like to dislike',
    disLike: 'dislike',
    unDisLike: 'undislike'
}

const ReactionSchema = new mongoose.Schema({
    blog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ["like", "dislike"],
        required: true
    }
});

const REACTION_POPULATE = {
    path: "user",
    select: 'username'
}

ReactionSchema.statics.deleteReaction = function ({ userId, blogId }) {
    return Reaction.findOneAndDelete({ user: userId, blog: blogId });
}

ReactionSchema.statics.addReaction = function ({ userId, blogId, type }) {
    const reaction = new Reaction({ user: userId, blog: blogId, type });
    return reaction.save();
}

ReactionSchema.statics.getReaction = function ({ userId, blogId }) {
    return Reaction.findOne({ user: userId, blog: blogId }).populate(REACTION_POPULATE);
}

ReactionSchema.statics.deleteAllBlogReactions = function (blogId) {
    return Reaction.deleteMany({ blog: blogId });
}

ReactionSchema.statics.getReactions = function ({ blogId, type }) {
    return Reaction.find({ blog: blogId, type }).populate(REACTION_POPULATE).lean();
}

ReactionSchema.statics.updateReactions = function ({ blog, operation }) {
    if (operation == REACTIONS_OPERATIONS.like) {
        blog.reactions.likes++;
    } else if (operation == REACTIONS_OPERATIONS.disLike) {
        blog.reactions.disLikes++;
    } else if (operation == REACTIONS_OPERATIONS.unlike) {
        blog.reactions.likes--;
    } else if (operation == REACTIONS_OPERATIONS.likeToDislike) {
        blog.reactions.likes--;
        blog.reactions.disLikes++;
    } else if (operation == REACTIONS_OPERATIONS.disLikeToLike) {
        blog.reactions.likes++;
        blog.reactions.disLikes--;
    } else if (operation == REACTIONS_OPERATIONS.unDisLike) {
        blog.reactions.disLikes--;
    }

    if (blog.reactions.likes < 0)
        blog.reactions.likes = 0

    if (blog.reactions.disLikes < 0)
        blog.reactions.disLikes = 0

    return blog.save();
}

const Reaction = mongoose.model('Reaction', ReactionSchema);

module.exports = Reaction;

module.exports.REACTIONS_OPERATIONS = REACTIONS_OPERATIONS;