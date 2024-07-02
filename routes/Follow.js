const router = require("express").Router();
const FollowController = require("../controller/Follow");
const AuthMiddleware = require("../middleware/Auth");
const mongooseIdRegex = require("../regex/mongooseId");
const ErrorMiddleware = require("../middleware/Error");
const commonUtils = require("../utils/commonUtils");


router.use(mongooseIdRegex, commonUtils.validateMongooseId("authorId"), commonUtils.checkDocumentExists("User", "authorId"))

router.get("/totalFollowers/:authorId", FollowController.getTotalFollowers);

// Authentication ONLY
router.use(AuthMiddleware.ensureAuthenticated);
router.get("/isFollowing/:authorId", FollowController.isFollowingAuthor);
router.get("/isFollower/:userId", FollowController.isUserFollower);
router.post("/:authorId", FollowController.followAuthor);
router.delete("/unfollow/:authorId", FollowController.unfollowAuthor);

// author access only
router.use(mongooseIdRegex, AuthMiddleware.authorAccessOnly("Follow"));
router.get("/followers/:page?", FollowController.getFollowers);
// router.get("/followers/:authorId/:page?", FollowController.getFollowers);
router.get("/followings/:page?", FollowController.getFollowings);

router.use(ErrorMiddleware);

module.exports = router;