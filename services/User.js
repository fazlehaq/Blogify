const User = require("../models/User");

async function getUserData(userId) {
    return User.findById(userId).select('-role -updatedAt -git_id')
}

function getTagsFollowed(id) {
    return User.findById(id).select('-_id interests');
}

module.exports = { getUserData, getTagsFollowed }