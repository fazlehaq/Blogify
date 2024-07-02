const mongoose = require('mongoose');
const LIMIT = 2;
const ErrorClasses = require("../errorClasses")

const CommentSchema = new mongoose.Schema({
    text: {
        type: String,
        maxlength: 200,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    blog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog',
        required: true
    },
    replyCount: {
        type: Number,
        default: 0
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    replyToComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    replyToAuthor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    depth: {
        type: Number,
        default: 0,
        max: 1,
    },
    reactionCounts: {
        likes: {
            type: Number,
            default: 0,
        },
        dislikes: {
            type: Number,
            default: 0
        }
    },
    reactions: {
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        dislikes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }]
    }
});

const COMMENT_SELECT = '-reactions -updatedAt'

const AUTHOR_POPULATE = {
    path: 'author',
    select: 'username avatar_url'
}

CommentSchema.methods.populateComment = function () {
    return this.populate(AUTHOR_POPULATE);
}

CommentSchema.statics.deleteComment = function (commentId) {
    return Comment.findOneAndDelete({ _id: commentId });
}

CommentSchema.statics.addComment = function (comment) {
    return Comment.create(comment)
}

CommentSchema.statics.getCommentById = function (commentId) {
    return Comment.findById(commentId);
}

CommentSchema.statics.updateComment = function ({ comment, updatedText }) {
    comment.text = updatedText;
    return comment.save();
}

CommentSchema.statics.getFirstLevelComment = async function ({ blogId, cursor }) {
    const queryObject = {
        blog: blogId,
        parentComment: null
    }

    try {
        let query = Comment.find(queryObject)
            .sort({ createdAt: -1 })
            .populate(AUTHOR_POPULATE)
            .select(COMMENT_SELECT)
            .lean();

        if (cursor) {
            let comment = await Comment.getCommentById(cursor);
            if (!comment) throw new ErrorClasses.ResourceNotFoundError("Invalid Cursor");
            query = query.find({
                ...queryObject,
                $or: [
                    { createdAt: comment.createdAt, _id: { $lt: comment._id } },
                    { createdAt: { $lt: comment.createdAt } }
                ]
            })
        }

        return query.limit(LIMIT);

    } catch (error) {
        next(error)
    }

}

CommentSchema.statics.getReplies = async function ({ commentId, cursor }) {
    console.log(cursor)
    const queryObject = {
        parentComment: commentId
    }

    try {
        let query = Comment.find(queryObject)
            .sort({ createdAt: 1 })
            .populate(AUTHOR_POPULATE)
            .select(COMMENT_SELECT)
            .lean();

        if (cursor !== null) {
            const reply = await Comment.findById(cursor);
            if (!reply) throw new ErrorClasses.ResourceNotFoundError("Invalid Cursor");
            query = query.find({
                ...queryObject, $or: [
                    { createdAt: reply.createdAt, _id: { $gt: reply._id } },
                    { createdAt: { $gt: reply.createdAt } }
                ]
            })
        }

        return query.limit(LIMIT)
    } catch (error) {
        next(error)
    }

}

CommentSchema.statics.getTotalCommentsWritten = function (id) {
    return Comment.countDocuments({ author: id });
}

CommentSchema.methods.toggleLike = function (userId) {

    const userLiked = this.reactions.likes.includes(userId);
    const userDisliked = this.reactions.dislikes.includes(userId);

    let verb = ""

    if (userLiked) {
        this.reactions.likes.pull(userId);
        this.reactionCounts.likes--;
        verb = "unliked"
    } else {
        this.reactions.likes.push(userId);
        this.reactionCounts.likes++;
        verb = "liked"
    }

    // 
    if (userDisliked) {
        this.reactions.dislikes.pull(userId);
        this.reactionCounts.dislikes--;
    }


    if (this.reactionCounts.likes < 0)
        this.reactionCounts.likes = 0

    if (this.reactionCounts.dislikes < 0)
        this.reactionCounts.dislikes = 0

    let msg = `User has ${verb} the comment!`;
    return { query: this.save(), msg, action: verb };
}

CommentSchema.methods.toggleDislike = function (userId) {
    const userDisliked = this.reactions.dislikes.includes(userId);
    const userLiked = this.reactions.likes.includes(userId);

    let verb = ""

    if (userDisliked) {
        this.reactions.dislikes.pull(userId);
        this.reactionCounts.dislikes--;
        verb = "unDisliked"
    } else {
        this.reactions.dislikes.push(userId);
        this.reactionCounts.dislikes++;
        verb = "disliked"
    }

    if (userLiked) {
        this.reactions.likes.pull(userId);
        this.reactionCounts.likes--;
    }

    if (this.reactionCounts.likes < 0)
        this.reactionCounts.likes = 0

    if (this.reactionCounts.dislikes < 0)
        this.reactionCounts.dislikes = 0

    let msg = `User has ${verb} the comment!`;
    return { query: this.save(), msg, action: verb };
}

CommentSchema.statics.deleteAllBlogComments = function (blogId) {
    return Comment.deleteMany({ blog: blogId });
}

CommentSchema.statics.getRecentUserComments = function (userId, getAll = false) {
    const DEFAULT_LIMIT = 10;
    const limit = getAll ? null : DEFAULT_LIMIT;

    return Comment.find({
        author: userId,
        depth: 0
    })
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate({
            path: "blog",
            select: "title"
        })
        .select('text createdAt replyToComment')
        .lean();
}

CommentSchema.post('findOneAndDelete', async function (comment) {
    if (comment.depth == 0) {
        await Comment.deleteMany({ parentComment: comment._id });
    }

    if (comment.depth == 1) {
        const parentComment = await Comment.getCommentById(comment.parentComment);
        parentComment.replyCount--;
        parentComment.save();
    }
})

CommentSchema.post('save', async function (comment) {
    if (comment.parentComment != null) {
        const parentComment = await Comment.getCommentById(comment.parentComment);
        parentComment.replyCount++;
        await parentComment.save();
    }
})


const Comment = mongoose.model('Comment', CommentSchema);

module.exports = { LIMIT }
module.exports = Comment
