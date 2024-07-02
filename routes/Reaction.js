const router = require("express").Router()
const ReactionController = require("../controller/Reaction");
const BlogMiddleware = require('../middleware/Blog');
const AuthMiddleware = require("../middleware/Auth");
const mongooseIdRegex = require("../regex/mongooseId");
const ErrorMiddleware = require("../middleware/Error");

router.use(mongooseIdRegex, BlogMiddleware.validateBlogId, BlogMiddleware.isBlogExists);
router.get("/likes/:blogId", ReactionController.getLikes);
router.get("/dislikes/:blogId", ReactionController.getDisLikes);

// Authentication ONLY
router.use(AuthMiddleware.ensureAuthenticated);
router.get("/reaction/:blogId", ReactionController.getReaction);
router.put("/like/:blogId", ReactionController.toggleLike);
router.put("/dislike/:blogId", ReactionController.toggleDisLike);

router.use(ErrorMiddleware);

module.exports = router;
