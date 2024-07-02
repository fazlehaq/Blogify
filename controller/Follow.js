const Follow = require("../models/Follow");
const ErrorClasses = require('../errorClasses');

async function followAuthor(req, res, next) {
    const { authorId } = req.params;
    const userId = req.user.data._id; // JWT

    if (!authorId) throw new ErrorClasses.InvalidInputError("author Id field is required");

    try {

        // const isFollowing = await Follow.isFollowingExists({ userId, authorId });
        // if (isFollowing) return res.status(409).json({ msg: "Already Following The Author" });

        const follow = await Follow.getFollowing({ userId, authorId });
        if (follow) return res.status(409).json({ error: "Already Following The Author" });

        const newFollow = await Follow.followAuthor({ userId, authorId })
        const populatedFollow = await newFollow.populateFollow().execPopulate()

        return res.json({
            message: `You are now following author ${authorId}`,
            follow: populatedFollow
        });
    } catch (error) {
        return next(error);
    }
}

async function isFollowingAuthor(req, res, next) {
    const { authorId } = req.params;
    const userId = req.user.data._id; //JWT

    // if (!authorId) return res.status(400).json({ error: "author Id field is required" });
    if (!authorId) throw new ErrorClasses.InvalidInputError("author Id field is required");

    try {
        const isFollowing = await Follow.isFollowingExists({ userId, authorId });
        const msg = isFollowing != null ? `User is following the author` : `User is not following the author`;

        return res.json({
            isFollowing: isFollowing != null,
            msg
        })

    } catch (error) {
        next(error)
    }
}

async function isUserFollower(req, res, next) {
    // here userId and author Id is reverted so isFollowing generates the correct output
    // they are reverted because roles are reverted 
    const { userId } = req.params;
    const authorId = req.user.data._id; //

    if (!authorId || !userId) throw new ErrorClasses.InvalidInputError("author Id field is required");

    try {
        const isFollower = await Follow.isFollowingExists({ userId, authorId });
        const msg = isFollower != null ? `User is follower of the author` : `User is not follower of the author`;

        return res.json({
            isFollower: isFollower != null,
            msg
        })

    } catch (error) {
        next(error)
    }
}

async function getFollowers(req, res, next) {
    const authorId = req.user.data._id;
    const page = req.params.page || 0;

    // if (!authorId) return res.status(400).json({ error: "author Id field is required" });
    if (!authorId) throw new ErrorClasses.InvalidInputError("author Id field is required");

    try {
        const followers = await Follow.getFollowers(authorId, page);
        if (followers.length == 0) return res.status(404).json({ error: "No Followers" });
        return res.json({ followers, msg: "followers" });
    } catch (error) {
        next(error);
    }
}

async function unfollowAuthor(req, res, next) {
    const { authorId } = req.params;
    const userId = req.user.data._id; //JWT

    if (!authorId) throw new ErrorClasses.InvalidInputError("author Id field is required");


    try {
        const isFollowing = await Follow.isFollowingExists({ authorId, userId });
        if (!isFollowing) throw new ErrorClasses.ResourceNotFoundError("Not Following!");

        const unfollow = await Follow.unfollowAuthor({ authorId, userId })
        if (!unfollow) throw new ErrorClasses.ResourceNotFoundError("Couldn't Unfollow");

        return res.json({ msg: "Unfollowed SuccessFully" });
    } catch (error) {
        next(error);
    }
}

async function getFollowings(req, res, next) {
    const userId = req.user.data._id;
    const page = req.params.page || 0;

    try {
        const followings = await Follow.getFollowings(userId, page);
        if (!followings) throw new ErrorClasses.ResourceNotFoundError("No followings found !");
        return res.json({ followings });
    } catch (error) {
        next(error);
    }
}

async function getTotalFollowers(req, res, next) {
    const { authorId } = req.params;

    if (!authorId) throw new ErrorClasses.InvalidInputError("author Id is required");

    try {
        const totalFollowers = await Follow.getTotalFollowers(authorId);
        return res.json({ totalFollowers });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    followAuthor,
    isFollowingAuthor,
    getFollowers,
    unfollowAuthor,
    getFollowings,
    getTotalFollowers,
    isUserFollower
};