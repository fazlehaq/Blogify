const router = require("express").Router();
const UserController = require("../controller/User");
const UserMiddleware = require("../middleware/User");
const ErrorMiddleware = require("../middleware/Error")


router.get("/:userId", UserMiddleware.validateUserId, UserController.getUserProfile);

router.get("/commentsWritten/:userId", UserMiddleware.validateUserId, UserMiddleware.isUserExists, UserController.getTotalCommentsWritten);

router.get("/blogsPosted/:userId", UserMiddleware.validateUserId, UserMiddleware.isUserExists, UserController.getTotalBlogsPosted);


router.use(ErrorMiddleware);

module.exports = router 