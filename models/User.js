const mongoose = require("mongoose");
const { tagIds } = require("../services/tags");
const userSchema = new mongoose.Schema({
    git_id: {
        type: Number,
        required: true,
        unique: true,
    },
    email: {
        type: String,
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    interests: {
        type: [Number],
        enum: tagIds
    },
    bio: {
        type: String,
        maxlength: 200,
    },
    profile_url: {
        type: String,
        required: true
    },
    avatar_url: {
        type: String,
    },
    social_links: {
        twitter: { type: String },
        facebook: { type: String },
        linkedin: { type: String },
        github: { type: String },
    },
    // work: {
    //     type: String,
    //     maxlength: 75
    // },
    skills: {
        type: [String],
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

userSchema.statics.isExists = function (git_id) {
    return User.exists({ git_id });
}

userSchema.statics.createUser = function (user) {
    return User.create(user);
}


const User = new mongoose.model("User", userSchema);

module.exports = User;
