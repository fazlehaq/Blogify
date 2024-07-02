const router = require('express').Router();
const Comment = require('../models/Comment');
const CommentController = require("../controller/Comment");
const BlogMiddleware = require("../middleware/Blog");
const CommentMiddleware = require("../middleware/Comment");
const UserMiddleware = require("../middleware/User");
const ErrorMiddleware = require('../middleware/Error');
const AuthMiddleware = require('../middleware/Auth');
const mongooseIdRegex = require("../regex/mongooseId");


router.get("/all/:userId", UserMiddleware.validateUserId, UserMiddleware.isUserExists, CommentController.getAllCommentsOfUser)
router.get("/replies/:commentId/:page?", CommentMiddleware.validateCommentId, CommentMiddleware.isCommentExists, CommentController.getReplies);
router.get("/:blogId/:page?", BlogMiddleware.validateBlogId, BlogMiddleware.isBlogExists, CommentController.getCommentsOfBlog);


// Authenticated only
router.use(AuthMiddleware.ensureAuthenticated);
router.post("/", CommentController.addComment);
router.post("/like/:commentId", CommentMiddleware.validateCommentId, CommentMiddleware.isCommentExists, CommentController.toggleLike);
router.post("/dislike/:commentId", CommentMiddleware.validateCommentId, CommentMiddleware.isCommentExists, CommentController.toggleDislike);

// Author Only
router.use(mongooseIdRegex, AuthMiddleware.authorAccessOnly("Comment"));
router.put("/:commentId", CommentMiddleware.validateCommentId, CommentMiddleware.isCommentExists, CommentController.updateComment);
router.delete("/:commentId", CommentMiddleware.validateCommentId, CommentMiddleware.isCommentExists, CommentController.deleteComment);

router.use(ErrorMiddleware)

module.exports = router;