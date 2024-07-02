require("dotenv").config();
const express = require("express");
const app = express();
const path = require('path')
const session = require('express-session');
const methodeOverride = require('method-override');
const cors = require("cors")

// routers
const AuthRouter = require("./routes/Auth");
const BlogRouter = require("./routes/Blog")
const UserRouter = require("./routes/User")
const FollowRouter = require("./routes/Follow");
const ReactionRouter = require("./routes/Reaction");
const CommentRouter = require("./routes/Comment")

// configs 
const { connectDB } = require("./config/DB");
const passport = require("./config/Passport")


// necessary middleware
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true
    })
)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(methodeOverride("_method"));

// passport js middlewares 
app.use(session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.session());
app.use(passport.initialize());

app.get("/data/tags", (req, res) => {
    res.sendFile(path.join(__dirname, "data/tags.json"))
});

app.use("/auth", AuthRouter);
app.use("/blog", BlogRouter);
app.use("/user", UserRouter);
app.use("/follow", FollowRouter);
app.use("/reaction", ReactionRouter);
app.use("/comment", CommentRouter)

// testing 
const Blog = require("./models/Blog");
const Comment = require("./models/Comment");
const Reaction = require("./models/Reaction");
app.get("/delete/all", async (req, res) => {
    try {
        await Blog.deleteMany({});
        await Comment.deleteMany({});
        await Reaction.deleteMany({});

        return res.json({ msg: "deleted" })
    } catch (error) {
        console.log(error.message)
    }
})

connectDB().then(() => {
    app.listen(process.env.PORT, () =>
        console.log("Server Is Listening and DB is Connected")
    );
}).catch(e => {
    console.error(e.message)
});
