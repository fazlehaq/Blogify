const TagsService = require("../services/tags");

function populateBlogs(blogs) {
    return blogs.map(blog => {
        blog.tags = TagsService.populateTags(blog.tagIds);
        delete blog[tagIds]
    })
}

module.exports = {
    populateBlogs
}