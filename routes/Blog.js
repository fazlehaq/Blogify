const router = require("express").Router()
const BlogController = require("../controller/Blog");
const BlogMiddleware = require("../middleware/Blog");
const Blog = require("../models/Blog")
const UploadCoverPhoto = require("../middleware/Upload");
const ErrorMiddleware = require("../middleware/Error")
const AuthMiddleware = require("../middleware/Auth")
const mongooseIdRegex = require("../regex/mongooseId");


// tests 
// const Blog = require("../models/Blog")
router.get("/total", async (req, res) => {
    try {
        const response = await Blog.countDocuments();
        res.json({ response })
    } catch (error) {
        next(error)
    }
})


router.get("/view/:slug", BlogController.getBlogBySlug);
router.get("/similiarBlogs", BlogController.getSimiliarBlogs);
router.get("/newest", BlogController.getNewBlogs);
router.get("/trending", BlogController.getTrendingBlogs);
router.get("/author/:authorId", BlogController.getAuthorBlogs)
router.get("/relevant", BlogController.getRelevantBlogs);

// router.get("/:blogId", async (req, res, next) => {
//     try {
//         const blogId = req.params.blogId;
//         const blog = await Blog.findById(blogId);
//         return res.json({ blog });
//     } catch (error) {
//         next(error);
//     }
// })


// Authentication ONLY
router.use(AuthMiddleware.ensureAuthenticated);

router.get("/followedPosts/:page?", BlogController.getFollowedPosts)

router.post("/",
    UploadCoverPhoto.fields([{ name: 'coverImage', maxCount: 1 }]),
    BlogMiddleware.filterBlogFields,
    BlogController.createNewBlog
);


// Author access ONLY
router.use(mongooseIdRegex, AuthMiddleware.authorAccessOnly("Blog"));

router.put('/:blogId',
    BlogMiddleware.validateBlogId,
    BlogMiddleware.filterUpdateFields,
    BlogController.updateBlogById
);

router.patch("/coverImage/:blogId",
    BlogMiddleware.validateBlogId,
    UploadCoverPhoto.fields([{ name: 'coverImage', maxCount: 1 }]),
    BlogController.updateCoverImage
)

router.delete("/coverImage/:blogId",
    BlogMiddleware.validateBlogId,
    BlogController.deleteCoverImage
);

router.delete("/:blogId",
    BlogMiddleware.validateBlogId,
    BlogController.deleteBlogById
)


router.use(ErrorMiddleware)


module.exports = router;                        