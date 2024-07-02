const commonUtils = require("../utils/commonUtils");
const Comment = require("../models/Comment");

const isCommentExists = commonUtils.checkDocumentExists("Comment", "commentId");
const validateCommentId = commonUtils.validateMongooseId("commentId");



module.exports = { isCommentExists, validateCommentId };