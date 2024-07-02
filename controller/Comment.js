const Comment = require("../models/Comment")
const ErrorClasses = require("../errorClasses");
const { LIMIT } = require("../models/Comment");

async function getAllCommentsOfUser(req, res, next) {
    const { userId } = req.params;

    try {
        const comments = await Comment.getRecentUserComments(userId, true);
        if (comments.length == 0) throw new ErrorClasses.ResourceNotFoundError('Comments Not Found');
        return res.json({ comments });
    } catch (error) {
        next(error);
    }
}

async function getCommentsOfBlog(req, res, next) {
    const { blogId } = req.params;
    const page = req.params.page || 0;
    const cursor = req.query.cursor || null;

    try {
        console.log(Comment.getFirstLevelComment);
        const firstLevelComments = await Comment.getFirstLevelComment({ blogId, cursor })

        // if (firstLevelComments.length == 0) return res.status(404).json({ error: "No Coments !" });
        if (firstLevelComments.length == 0) throw new ErrorClasses.ResourceNotFoundError('Comments Not Found !');

        const nestedComments = await Promise.all(firstLevelComments.map(async (comment) => {
            const replies = await Comment.getReplies({ commentId: comment._id, cursor });
            return {
                ...comment,
                replies: replies,
            };
        }));


        const nextPageCursor = nestedComments.length < LIMIT ? null : nestedComments[nestedComments.length - 1]._id;
        const hasNextPage = nextPageCursor == null ? false : await hasMoreComments(nextPageCursor)

        return res.json({
            comments: nestedComments,
            nextPageCursor: hasNextPage ? nextPageCursor : null,
            hasNextPage
        });
    } catch (error) {
        next(error)
    }

    async function hasMoreComments(cursor) {
        try {
            const comment = await Comment.getCommentById(cursor);
            if (!comment) ErrorClasses.ResourceNotFoundError("Invalid Cursor");
            let query = Comment.countDocuments({
                blog: comment.blog, parentComment: null, $or: [
                    { createdAt: comment.createdAt, _id: { $lt: comment._id } },
                    { createdAt: { $lt: comment.createdAt } }
                ]
            })
                .sort({ createdAt: -1 })
                .lean()

            const response = await query;

            return Boolean(response);
        } catch (error) {
            next(error);
        }
    }


}

async function getReplies(req, res, next) {
    const { commentId } = req.params;
    const page = req.params.page || 0;
    const cursor = req.query.cursor || null;

    try {
        const replies = await Comment.getReplies({ commentId, cursor });
        if (replies.length == 0) throw new ErrorClasses.ResourceNotFoundError('No Replies Found !');

        // const nextPageCursor = replies.length < LIMIT ? null : replies[replies.length - 1]._id;
        // const hasNextPage = nextPageCursor == null ? false : await hasMoreReplies(nextPageCursor)

        const nextPageCursor = replies.length < LIMIT ? null : replies[replies.length - 1]._id;
        const hasNextPage = nextPageCursor == null ? false : await hasMoreReplies(nextPageCursor)

        // return res.json({
        //     replies,
        //     nextPageCursor: hasNextPage ? nextPageCursor : null,
        //     hasNextPage
        // });
        return res.json({
            replies,
            nextPageCursor: hasNextPage ? nextPageCursor : null,
            hasNextPage
        });
    } catch (error) {
        next(error)
    }

    async function hasMoreReplies(cursor) {

        try {
            const reply = await Comment.getCommentById(cursor);
            if (!reply) throw new ErrorClasses.ResourceNotFoundError("Invalid Cursor");
            let query = Comment.countDocuments({
                blog: reply.blog,
                parentComment: reply.parentComment,
                $or: [
                    { createdAt: reply.createdAt, _id: { $gt: reply._id } },
                    { createdAt: { $gt: reply.createdAt } }
                ]
            })
                .sort({ createdAt: 1 })
                .lean()

            const response = await query;
            return Boolean(response);
        } catch (error) {
            throw (error);
        }
    }
}

async function addComment(req, res, next) {
    const { comment } = req.body
    comment.author = req.user.data._id;

    if (comment.parentComment) {
        comment.depth = 1
    };

    try {
        const newComment = await Comment.addComment(comment);
        const populatedComment = await newComment.populateComment();
        return res.status(201).json({ comment: populatedComment });
    } catch (error) {
        next(error)
    }
};

async function deleteComment(req, res, next) {
    const { commentId } = req.params;
    try {
        const deletedComment = await Comment.deleteComment(commentId);
        if (deletedComment)
            return res.status(204).json({ msg: "Comment Deleted !", deleteComment });
        else
            throw new ErrorClasses.ResourceNotFoundError('No Comment Found !');
    } catch (error) {
        next(error)
    }

}


async function updateComment(req, res, next) {
    const { commentId } = req.params;
    const { updatedText } = req.body;

    try {
        const comment = await Comment.getCommentById(commentId);
        if (!comment) throw new ErrorClasses.ResourceNotFoundError('No Comment Found !');

        const updatedComment = await Comment.updateComment({ comment, updatedText });
        return res.json({ updatedComment });
    } catch (error) {
        next(error)
    }
}


async function toggleLike(req, res, next) {
    const { commentId } = req.params;
    const { userId } = req.user.data._id;

    try {
        const comment = await Comment.getCommentById(commentId);
        if (!comment) throw ErrorClasses.ResourceNotFoundError('Comment Not Found !');

        const { query, msg } = await comment.toggleLike(userId);
        const updatedComment = await query;

        return res.json({ comment: updatedComment, msg: msg });
    } catch (error) {
        next(error)
    }
}

async function toggleDislike(req, res, next) {

    const { commentId } = req.params;
    const { userId } = req.user.data._id;

    try {
        const comment = await Comment.getCommentById(commentId);
        if (!comment) throw ErrorClasses.ResourceNotFoundError('Comment Not Found !');

        const { query, msg } = await comment.toggleDislike(userId);
        const updatedComment = await query;
        return res.json({ comment: updatedComment, msg: msg });
    } catch (error) {
        next(error);
    }
}

module.exports = { getCommentsOfBlog, addComment, deleteComment, updateComment, toggleLike, toggleDislike, getReplies, getAllCommentsOfUser }