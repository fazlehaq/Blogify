require("dotenv").config()
const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL
const passport = require("../config/Passport");
const ErrorMiddleware = require("../middleware/Error");
const router = require('express').Router();
const ErrorClasses = require("../errorClasses");



router.get('/github', passport.authenticate('github'));


router.get('/github/callback', passport.authenticate('github', {
    successRedirect: CLIENT_BASE_URL,
    // successReturnToOrRedirect: true,
    failureRedirect: 'login',

}));

router.get("/github/profile", (req, res, next) => {
    if (req.isAuthenticated()) {
        const user = req.user;
        return res.json({ user });
    }
    throw new ErrorClasses.AuthenticationRequiredError();
});

router.get('/logout', (req, res, next) => {
    if (!req.isAuthenticated())
        return res.status(400).json({ error: "Not Logged In" });

    req.logout((err) => {
        if (err)
            return next(err);

        req.session.destroy((err) => {
            if (err) return next(err);
            return res.status(200).json({ msg: "Logged Out" });
        })
    });
});

router.get("/github/login", (req, res) => {
    res.send('login');
})

router.get('/isAuthenticated', (req, res) => {
    if (req.isAuthenticated()) {
        res.send('Authenticated');
    } else {
        res.send('Not Authenticated');
    }
});



router.use(ErrorMiddleware);

module.exports = router;