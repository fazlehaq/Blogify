const mongoose = require("mongoose");
const { tagIds } = require('../services/tags');
const slugify = require("slugify");
const UploadServices = require("../services/Uploads");
const TagsServices = require("../services/tags");
const Reaction = require("../models/Reaction");
const jsdom = require("jsdom");
const Comment = require("./Comment");
const { JSDOM } = jsdom;
const DOMPurify = require("dompurify")(new JSDOM().window);
const BLOGS_PER_REQUEST = 50;



const BlogSchema = new mongoose.Schema({
    title: {
        type: String,
        maxlength: 50,
        required: true,
        unique: true,
    },
    snippet: {
        type: String,
        required: true,
        maxlength: 50,
    },
    body: {
        type: String,
        required: true,
    },
    sanitizedMarkDown: {
        // sanitizing for potential malicious code
        default: function () {
            return DOMPurify.sanitize(this.body)
        },
        type: String,
    },
    author: {
        immutable: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tagIds: {
        type: [Number],
        enum: tagIds,
        maxlength: 4
    },
    saveAsDraft: {
        type: Boolean,
        default: false,
    },
    reactions: {
        likes: {
            type: Number,
            default: 0,
        },
        disLikes: {
            type: Number,
            default: 0
        }
    },
    viewCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true,
    },
    sheduledAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    slug: {
        type: String,
        unique: true,
    },
    coverImage: {
        type: String,
        default: null,
    }
});

// pre post hooks
BlogSchema.pre('save', function (next) {
    if (this.title) {
        this.slug = slugify(this.title, { lower: true });
    }
    if (this.body) {
        this.sanitizedMarkDown = DOMPurify.sanitize(this.body);
    }
    if (this.isModified('tagIds') && (this._original && this._original.get('tagIds'))) {
        const previousTagIds = this._original ? this._original.get('tagIds') : [];
        const latestTagIds = this.tagIds;
        TagsServices.updateTagsCounts({ previousTagIds, latestTagIds });
    }
    if (this.tagIds) {
        this.tagIds = [...new Set(this.tagIds)];
    }
    next();
});

BlogSchema.post('findOneAndDelete', async function (doc) {
    if (doc && doc.coverImage) {
        try {
            const coverImagePath = UploadServices.stripDoubleBackSlashes(doc.coverImage);
            await UploadServices.deleteFile(coverImagePath);
        } catch (error) {
            next(error);
        }
    }
    const blogId = doc._id;
    await Reaction.deleteAllBlogReactions(blogId);
    await Comment.deleteAllBlogComments(blogId);
});

BlogSchema.post('find', async function (docs) {
    if (this?.conditions?._id) {

    } else {
        docs.forEach(doc => {
            doc.tags = TagsServices.populateTags(doc.tagIds)
            delete doc.tagIds
        })
    }
})

// statics and methods
const BLOG_SELECT = '-createdAt -updatedAt -updatedAt -body';
const BLOGS_SELECT = '-body -saveAsDraft -createdAt -updatedAt  -coverImage -sanitizedMarkDown';
const AUTHOR_POPULATE = {
    path: 'author',
    select: 'username avatar_url'
}
const BLOG_VISIBLE_CONDITIONS = {
    sheduledAt: { $lte: new Date() },
    saveAsDraft: false
}

function BLOG_VISIBLE_CONDS() {
    return {
        sheduledAt: { $lte: new Date() },
        saveAsDraft: false
    }
}

BlogSchema.statics.getBlogBySlug = function (slug) {
    const queryObject = { slug, ...BLOG_VISIBLE_CONDS() };
    return Blog.findOne(queryObject)
        .select(BLOG_SELECT)
        .populate(AUTHOR_POPULATE);
}

// BlogSchema.statics.getBlogsByAuthorId = async function ({ authorId, limit = null, cursor = null }) {
//     const queryObject = { author: authorId, ...BLOG_VISIBLE_CONDS() };

//     let query = Blog.find(queryObject)
//         .sort({ sheduledAt: -1 })
//         .select(BLOGS_SELECT)
//         .populate(AUTHOR_POPULATE)
//         .lean();

//     if (cursor) {
//         const blog = await Blog.findById(cursor)
//         query.find({
//             ...queryObject,
//             $or: [
//                 { sheduledAt: blog.sheduledAt, _id: { $lt: blog._id } },
//                 { sheduledAt: { $lt: blog.sheduledAt } }
//             ]
//         })
//     }

//     const blogs = await query.limit(limit || BLOGS_PER_REQUEST)

//     if (limit) {
//         return { blogs };
//     }

//     return {
//         blogs,
//         hasNextPage: blogs.length == BLOGS_PER_REQUEST,
//         nextPageCursor: this.hasNextPage ? blogs[blogs.length - 1]._id : null
//     }
// }

BlogSchema.statics.getBlogsByAuthorId = async function ({ authorId, limit = null, cursor = null }) {
    const queryObject = { author: authorId, ...BLOG_VISIBLE_CONDS() };

    let query = Blog.find(queryObject)
        .sort({ sheduledAt: -1 })
        .select(BLOGS_SELECT)
        .populate(AUTHOR_POPULATE)
        .lean();

    if (cursor) {
        const blog = await Blog.findById(cursor);
        query = query.find({
            ...queryObject,
            $or: [
                { sheduledAt: blog.sheduledAt, _id: { $lt: blog._id } },
                { sheduledAt: { $lt: blog.sheduledAt } }
            ]
        });
    }

    const blogs = await query.limit(limit || BLOGS_PER_REQUEST);

    if (limit !== null) {
        return { blogs };
    }

    return {
        blogs,
        hasNextPage: blogs.length === BLOGS_PER_REQUEST,
        nextPageCursor: blogs.length > 0 ? blogs[blogs.length - 1]._id : null
    };
};


// BlogSchema.statics.getNewBlogs = function (page) {
//     const queryObject = { ...BLOG_VISIBLE_CONDS() };

//     return Blog.find(queryObject)
//         .skip(Number(page) * BLOGS_PER_REQUEST - BLOGS_PER_REQUEST)
//         .limit(BLOGS_PER_REQUEST)
//         .select(BLOGS_SELECT)
//         .populate(AUTHOR_POPULATE)
//         .sort({ sheduledAt: -1 })
//         .lean();
// }

BlogSchema.statics.getNewBlogs = async function (cursor) {
    try {
        const queryObject = { ...BLOG_VISIBLE_CONDS() };

        let query = Blog.find(queryObject)
            .select(BLOGS_SELECT)
            .populate(AUTHOR_POPULATE)
            .sort({ sheduledAt: -1 })
            .lean();

        if (cursor) {
            const blog = await Blog.findById(cursor);
            if (!blog) throw new ErrorClasses.ResourceNotFoundError('Invalid Cursor');
            query = query.find({ ...queryObject, sheduledAt: { $lt: blog.sheduledAt } });
        }

        const blogs = await query.limit(BLOGS_PER_REQUEST);
        const hasNextPage = blogs.length == BLOGS_PER_REQUEST;

        return {
            blogs,
            nextPageCursor: hasNextPage ? blogs[blogs.length - 1]._id : null,
            hasNextPage
        };
    } catch (error) {
        throw error;
    }
}


// BlogSchema.statics.getTrendingBlogs = function (page) {
//     const pastWeek = new Date();
//     pastWeek.setDate(pastWeek.getDate() - 7);
//     const queryObject = { createdAt: { $gte: pastWeek }, ...BLOG_VISIBLE_CONDS() };

//     return Blog.find(queryObject)
//         .sort({ viewCount: -1 })
//         .skip(Number(page) * BLOGS_PER_REQUEST - BLOGS_PER_REQUEST)
//         .limit(BLOGS_PER_REQUEST)
//         .select(BLOGS_SELECT)
//         .populate(AUTHOR_POPULATE)
//         .lean();
// }

BlogSchema.statics.getTrendingBlogs = async function (cursor) {
    const pastWeek = new Date();
    pastWeek.setDate(pastWeek.getDate() - 7);
    const queryObject = {
        ...BLOG_VISIBLE_CONDS(),
        sheduledAt: {
            $lte: new Date(),
            $gte: pastWeek
        }
    };

    try {

        let query = Blog.find(queryObject)
            .select(BLOGS_SELECT)
            .populate(AUTHOR_POPULATE)
            .sort({ viewCount: -1, _id: -1 })
            .lean();

        if (cursor) {
            const blog = await Blog.findById(cursor);
            if (!blog) throw new ErrorClasses.ResourceNotFoundError('Invalid Cursor');
            query = query.find({
                $or: [
                    { viewCount: blog.viewCount, _id: { $lt: blog._id } },
                    { viewCount: { $lt: blog.viewCount } },
                ],
                ...queryObject
            });
        }

        const blogs = await query.limit(BLOGS_PER_REQUEST);

        // const hasNextPage = blogs.length === BLOGS_PER_REQUEST 
        const nextPageCursor = blogs.length === BLOGS_PER_REQUEST ? blogs[blogs.length - 1]._id : null;
        const hasNextPage = blogs.length < BLOGS_PER_REQUEST ? false : await hasMoreBlogs(nextPageCursor);

        // console.log(blogs)

        return ({ blogs, nextPageCursor: hasNextPage ? nextPageCursor : null, hasNextPage });
    } catch (error) {
        throw error;
    }

    async function hasMoreBlogs(nextPageCursor) {
        let query = Blog.countDocuments(queryObject)


        const blog = await Blog.findById(nextPageCursor);
        if (!blog) throw new ErrorClasses.ResourceNotFoundError('Invalid Cursor');

        query = query.countDocuments({
            $or: [
                { viewCount: blog.viewCount, _id: { $lt: blog._id } },
                { viewCount: { $lt: blog.viewCount } },
            ],
            ...queryObject
        })
            .select(BLOGS_SELECT)
            .populate(AUTHOR_POPULATE)
            .sort({ viewCount: -1, _id: -1 })


        const response = await query;

        return Boolean(response)
    }

};


BlogSchema.statics.createNewBlog = function (blog) {
    const newBlog = new Blog(blog)
    return newBlog.save();
}


BlogSchema.statics.getBlogById = function ({ blogId, visibleOnly = false, conditions = null }) {
    let query;

    if (visibleOnly)
        query = Blog.findOne({
            _id: blogId,
            ...BLOG_VISIBLE_CONDS(),
        });
    else
        query = Blog.findOne({ _id: blogId });

    if (conditions == null)
        return query;

    if (conditions && conditions.where) {
        query.where(conditions.where);
    }

    return query;
}


BlogSchema.statics.deleteBlog = function (id) {
    return Blog.findByIdAndDelete(id);
}

// BlogSchema.statics.getBlogsByTags = function ({ tagIds, page, ignoreBlogId }) {
//     // Differnciating between similiar and releveant blogs
//     // similiar blogs passes ignore id so blog is not repeated 
//     const limit = ignoreBlogId && 5 || BLOGS_PER_REQUEST;
//     const skip = ignoreBlogId && 0 || Number(page) * BLOGS_PER_REQUEST - BLOGS_PER_REQUEST

//     const queryObject = {
//         tagIds: { $in: tagIds },
//         _id: { $ne: ignoreBlogId },
//         ...BLOG_VISIBLE_CONDS()
//     }

//     return Blog.find(queryObject)
//         .sort({ sheduledAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .select(BLOGS_SELECT)
//         .populate(AUTHOR_POPULATE)
//         .lean();
// }

BlogSchema.statics.getBlogsByTags = async function ({ tagIds, cursor, ignoreBlogId }) {
    // Differnciating between similiar and releveant blogs
    // similiar blogs passes ignore id so blog is not repeated 
    const limit = ignoreBlogId && 5 || BLOGS_PER_REQUEST;

    try {

        const queryObject = {
            tagIds: { $in: tagIds },
            _id: { $ne: ignoreBlogId },
            ...BLOG_VISIBLE_CONDS()
        }

        let query = Blog.find(queryObject)
            .sort({ sheduledAt: -1 })
            .limit(limit)
            .select(BLOGS_SELECT)
            .populate(AUTHOR_POPULATE)
            .lean();

        if (cursor) {
            const blog = await Blog.findById(cursor);
            console.log(query)
            // query.find({ ...queryObject, ...{ sheduledAt: { $lte: blog.sheduledAt } } })
            query.find({
                ...queryObject,
                $or: [
                    { sheduledAt: blog.sheduledAt, _id: { $lt: blog._id } },
                    { sheduledAt: { $lt: blog.sheduledAt } }
                ]
            })
        }

        const blogs = await query.limit(limit);

        if (!ignoreBlogId) {
            const hasNextPage = blogs.length === BLOGS_PER_REQUEST;
            return {
                blogs,
                nextPageCursor: hasNextPage ? blogs[blogs.length - 1]._id : null,
                hasNextPage
            }
        }

        return {
            blogs
        }


    } catch (error) {
        throw error;
    }
}

BlogSchema.statics.getTotalBlogsPosted = function ({ id, visibleOnly = true }) {
    if (visibleOnly)
        return Blog.countDocuments({ author: id, ...BLOG_VISIBLE_CONDS() });
    else
        Blog.countDocuments({ author: id })
}

// BlogSchema.statics.getFollowedBlogs = function (followedAuthors, page) {
//     const LIMIT = 50;
//     const authorIds = followedAuthors.map(follow => follow._id);

//     return Blog.find({
//         author: { $in: authorIds },
//         ...BLOG_VISIBLE_CONDS()
//     }).sort({ sheduledAt: -1 })
//         .skip(LIMIT * page - page)
//         .limit(LIMIT)
//         .select(BLOGS_SELECT)
//         .populate(AUTHOR_POPULATE)
//         .lean();
// }

BlogSchema.statics.getFollowedBlogs = async function (followedAuthors, cursor) {
    // const LIMIT = 50;
    try {
        const authorIds = followedAuthors.map(follow => follow.author);
        const queryObject = {
            author: { $in: authorIds },
            ...BLOG_VISIBLE_CONDS()
        }

        let query = Blog.find(queryObject)
            .sort({ sheduledAt: -1 })
            .select(BLOGS_SELECT)
            .populate(AUTHOR_POPULATE)
            .lean();

        if (cursor) {
            const blog = await Blog.findById(cursor);
            query = query.find({
                $or: [
                    { sheduledAt: blog.sheduledAt, _id: { $lt: blog._id } },
                    { sheduledAt: { $lt: blog.sheduledAt } },
                ],
                ...queryObject,
            });
        }

        const blogs = await query.limit(BLOGS_PER_REQUEST);
        console.log(blogs)

        const hasNextPage = blogs.length == BLOGS_PER_REQUEST;
        const nextPageCursor = hasNextPage ? blogs[blogs.length - 1]._id : null;

        return {
            blogs,
            nextPageCursor,
            hasNextPage
        }
    } catch (error) {
        throw error
    }
}

BlogSchema.methods.updateBlog = function (updates) {
    Object.assign(this, updates);
    return this.save();
}

BlogSchema.methods.increamentViewCount = function () {
    this.viewCount++;
    return this.save();
}

const Blog = new mongoose.model('Blog', BlogSchema);

module.exports = Blog;
