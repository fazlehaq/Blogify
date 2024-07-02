const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User')

// Configure GitHub strategy
const GITHUB_CLIENT_ID = "83d12c85ea7632668afc";
const GITHUB_CLIENT_SECRET = "02e34eb26e17ee4bc02ffffe4fad31a7b1afea29";
const GITHUB_CALLBACK_URL = "http://localhost:3000/auth/github/callback";

passport.use(new GitHubStrategy({
    // GitHub strategy options
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: GITHUB_CALLBACK_URL,
}, (accessToken, refreshToken, profile, done) => {


    const user = {
        profile: profile,
        accessToken: accessToken
    }

    return done(null, user);
}));


passport.serializeUser(function (user, cb) {
    process.nextTick(async function () {
        try {
            const profile = user.profile._json;
            const isUserExists = await User.isExists(profile.id);
            if (!isUserExists) {
                const newUser = {};
                newUser.git_id = profile.id;
                newUser.username = profile.login;
                newUser.avatar_url = profile.avatar_url;
                newUser.profile_url = profile.html_url;
                newUser.bio = profile.bio;
                newUser.email = profile.email;
                const user = await User.createUser(newUser);
            }
        } catch (error) {
            const newError = new Error('Error While Creating user');
            newError.statusCode = 401;
            newError.stack = "";
            return cb(newError);
        }
        return cb(null, {
            git_id: user.profile.id,
            accessToken: user.accessToken,
        });
    });
});



passport.deserializeUser(function (user, cb) {
    process.nextTick(async function () {
        const userData = {};
        userData.accessToken = user.accessToken;
        userData.data = await User.findOne({ git_id: user.git_id });
        return cb(null, userData);
    });
});



module.exports = passport