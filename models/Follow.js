const mongoose = require('mongoose');
const User = require("../models/User")

const followSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    }
});

// 

const USER_POPULATE = {
    path: 'user',
    select: 'username avatar_url'
};

const AUTHOR_POPULATE = {
    path: 'author',
    select: 'username avatar_url'
}

followSchema.statics.getFollowing = function ({ userId, authorId }) {
    return Follow.findOne({
        user: userId,
        author: authorId
    })
        .populate(USER_POPULATE)
        .populate(AUTHOR_POPULATE);
}

followSchema.methods.populateFollow = function () {
    return this.populate(USER_POPULATE).populate(AUTHOR_POPULATE);
}


followSchema.statics.followAuthor = function ({ userId, authorId }) {
    let follow = new Follow({
        user: userId,
        author: authorId
    })
    return follow.save();
}

followSchema.statics.getFollowers = function (authorId, page) {
    const LIMIT = 50;
    return Follow.find({
        author: authorId
    })
        .skip(page * LIMIT)
        .limit(LIMIT)
        .populate(USER_POPULATE);
}

followSchema.statics.unfollowAuthor = function ({ authorId, userId }) {
    return Follow.findOneAndDelete({
        author: authorId,
        user: userId
    })
}

followSchema.statics.populateUserAndAuthor = function (followId) {
    return Follow.findById(followId)
        .populate({
            path: 'user',
            select: 'username avatar_url'
        }).populate({
            path: 'author',
            select: 'name avatar_url'
        })
}

followSchema.statics.isFollowingExists = function ({ userId, authorId }) {
    return Follow.exists({
        user: userId,
        author: authorId
    });
}

followSchema.statics.getFollowings = function (userId, page) {
    const LIMIT = 50;
    if (page == "all")
        return Follow.find({ user: userId })
            .populate(AUTHOR_POPULATE)
    else
        return Follow.find({ user: userId })
            .skip(page * LIMIT).
            limit(LIMIT)
            .populate(AUTHOR_POPULATE);
}

followSchema.statics.getTotalFollowers = function (authorId) {
    return Follow.countDocuments({ author: authorId });
}


const Follow = mongoose.model('Follow', followSchema);

module.exports = Follow;
