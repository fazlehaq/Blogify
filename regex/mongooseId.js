const mongooseIdRegex = /\/([0-9a-fA-F]{24})(\/\?_method=(PUT|PATCH|DELETE))?\/?$/;

module.exports = mongooseIdRegex;