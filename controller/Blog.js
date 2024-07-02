const Blog = require("../models/Blog");
const Follow = require("../models/Follow");
const Reaction = require("../models/Reaction");
const UserServices = require("../services/User");
const UploadServices = require("../services/Uploads");
const ErrorClasses = require('../errorClasses');
const TagsService = require("../services/tags");

async function getBlogBySlug(req, res, next) {
    const { slug } = req.params;
    const isAuthenticated = req.isAuthenticated();
    const ERROR_MESSAGE = "An error occurred while fetching data!";

    try {
        const blog = await Blog.getBlogBySlug(slug);

        if (!blog) {
            throw new ErrorClasses.ResourceNotFoundError('Blog Not Found');
        }

        const tagIds = blog.tagIds;
        const author = blog.author;

        const queries = [
            Blog.getBlogsByTags({ tagIds, ignore: blog._id }),
            Blog.getBlogsByAuthorId({ authorId: author, limit: 5 }),
        ];

        if (isAuthenticated) {
            queries.push(Reaction.getReaction({ userId: req.user.data._id, blogId: blog._id }));
        }

        const [similiarBlogs, moreFromAuthor, reaction] = await Promise.allSettled(queries);

        // here we are sending user both tags and tagIDs 
        // error

        const response = {
            blog: { ...blog._doc, tags: TagsService.populateTags(tagIds) },   // populating blog here 
            similiarBlogs: similiarBlogs.status === "fulfilled" ? similiarBlogs.value.blogs : null,
            moreFromAuthor: moreFromAuthor.status === "fulfilled" ? moreFromAuthor.value.blogs : null,
            reaction: isAuthenticated ? (reaction.status === "fulfilled" ? reaction.value?.type : null) : null,
            errors: {
                similiarBlogs: similiarBlogs.status === "rejected" ? ERROR_MESSAGE : null,
                moreFromAuthor: moreFromAuthor.status === "rejected" ? ERROR_MESSAGE : null,
                reaction: isAuthenticated && reaction.status === "rejected" ? ERROR_MESSAGE : null,
            },
        };

        res.json(response);

        await blog.increamentViewCount();
        return;
    } catch (error) {
        next(error);
    }
}

async function getSimiliarBlogs(req, res, next) {
    const { tagIds, blogId } = req.body;
    if (!tagIds) throw new ErrorClasses.InvalidInputError('Blog Tags Are Required !');

    try {
        const { blogs } = await Blog.getBlogsByTags({ tagIds, ignoreBlogId: blogId });
        if (blogs.length == 0) throw new ErrorClasses.ResourceNotFoundError('Blogs Not Found');
        return res.json({ blogs: blogs, msg: "similiar blogs" })
    } catch (error) {
        next(error);
    }
}

async function getNewBlogs(req, res, next) {
    // const page = req.params.page || 1;
    const cursor = req.query.cursor || null;

    try {
        const { blogs, hasNextPage, nextPageCursor } = await Blog.getNewBlogs(cursor)
        if (blogs.length == 0) throw new ErrorClasses.ResourceNotFoundError('Blogs Not Found');
        return res.json({ blogs, hasNextPage, nextPageCursor });
    } catch (error) {
        next(error);
    }
}

async function getTrendingBlogs(req, res, next) {
    const cursor = req.query.cursor || null;

    try {
        const { blogs, hasNextPage, nextPageCursor } = await Blog.getTrendingBlogs(cursor)
        if (blogs.length == 0) throw new ErrorClasses.ResourceNotFoundError('Blogs Not Found');
        return res.json({ blogs, hasNextPage, nextPageCursor })
    } catch (error) {
        next(error)
    }
}

async function getRelevantBlogs(req, res, next) {
    const interestIds = req.query?.interestIds?.split("-");
    const cursor = req.query.cursor || null;
    const userId = req?.user?.data?._id;

    console.log(interestIds, req.query.interests)

    try {
        let userInterests = req.isAuthenticated()
            ? await UserServices.getTagsFollowed(userId)
            : interestIds;

        if (!userInterests) throw new ErrorClasses.InvalidInputError('Missing userId or user Interests');
        const { blogs, hasNextPage, nextPageCursor } = await Blog.getBlogsByTags({ tagIds: userInterests.interests || userInterests, cursor });
        if (blogs.length == 0) throw new ErrorClasses.ResourceNotFoundError('Blogs Not Found');
        return res.json({ blogs, hasNextPage, nextPageCursor });
    } catch (error) {
        next(error);
    }
}


// auth

async function createNewBlog(req, res, next) {
    const blog = req.blog;

    if (req.files && req.files.coverImage) {
        blog.coverImage = req.files.coverImage[0].path;
    }

    blog.author = req.user.data._id;

    try {
        const newBlog = await Blog.createNewBlog(blog);
        res.status(201).json({ blog: newBlog });
        const tagIds = newBlog.tagIds;
        TagsService.increamentTagsCount(tagIds);
        return;
    } catch (error) {
        next(error);
    }
}

async function updateBlogById(req, res, next) {
    const { blogId } = req.params;
    const updates = req.updates;



    try {
        let blog = await Blog.getBlogById({ blogId });
        if (!blog) throw new ErrorClasses.ResourceNotFoundError('Blog Not Found');
        const updatedBlog = await blog.updateBlog(updates);
        return res.json({ blog: updatedBlog, msg: "Blog Updated!" });
    } catch (error) {
        next(error);
    }
}

async function deleteBlogById(req, res, next) {
    const { blogId } = req.params;

    try {
        const isDeleted = await Blog.deleteBlog(blogId);
        if (!isDeleted) throw new ErrorClasses.ResourceNotFoundError('Blogs Not Found');
        return res.status(204).json({ msg: "Blog deleted" });
    } catch (error) {
        next(error);
    }
}

async function getFollowedPosts(req, res, next) {
    const userId = req.user.data._id;
    console.log(userId)
    const cursor = req.query.cursor || null

    try {
        const followedAuthors = await Follow.getFollowings(userId, "all");
        console.log(followedAuthors)

        if (followedAuthors.length == 0)
            return res.status(204).json({ msg: "You Are Not Following Any One!" })

        const { blogs, hasNextPage, nextPageCursor } = await Blog.getFollowedBlogs(followedAuthors, cursor);

        if (blogs.length == 0) throw new ErrorClasses.ResourceNotFoundError('Blogs Not Found');

        return res.json({ blogs, hasNextPage, nextPageCursor })
    } catch (error) {
        next(error);
    }
}

async function getAuthorBlogs(req, res, next) {
    const cursor = req.query.cursor
    const { authorId } = req.params;
    console.log(authorId)

    try {
        if (!authorId)
            throw new ErrorClasses.InvalidInputError('Author Id Is Missing !');

        const { blogs, hasNextPage, nextPageCursor } = await Blog.getBlogsByAuthorId({ authorId, cursor });
        if (blogs.length == 0) throw new ErrorClasses.ResourceNotFoundError('Blogs Not Found');

        return res.json({ blogs, hasNextPage, nextPageCursor });
    } catch (error) {
        next(error);
    }
}

async function updateCoverImage(req, res, next) {
    const { blogId } = req.params;
    const newCoverImagePath = req.files.coverImage[0].path;

    try {
        const blog = await Blog.getBlogById({ blogId });
        if (!blog) throw new ErrorClasses.ResourceNotFoundError('Blogs Not Found');

        if (blog.coverImage) {
            const coverImagePath = UploadServices.stripDoubleBackSlashes(blog.coverImage);
            await UploadServices.deleteFile(coverImagePath);
        }

        blog.coverImage = newCoverImagePath;
        await blog.save();
        return res.json({ msg: "cover image  updated !", newImagePath: newCoverImagePath });
    } catch (error) {
        next(error)
    }
}

async function deleteCoverImage(req, res, next) {
    const { blogId } = req.params;

    try {
        const blog = await Blog.getBlogById({ blogId });

        if (!blog) throw new ErrorClasses.ResourceNotFoundError('Blog Not Found');
        if (!blog.coverImage) return res.status(404).json({ msg: "no coverImage" })

        await UploadServices.deleteFile(UploadServices.stripDoubleBackSlashes(blog.coverImage));
        blog.coverImage = null;
        await blog.save();
        return res.json({ msg: "coverImage Deleted" });
    } catch (error) {
        next(error);
    }
}


module.exports = {
    getBlogBySlug, getSimiliarBlogs, getNewBlogs, getTrendingBlogs,
    getRelevantBlogs, createNewBlog, updateBlogById, deleteBlogById, getFollowedPosts,
    getAuthorBlogs, updateCoverImage, deleteCoverImage
};