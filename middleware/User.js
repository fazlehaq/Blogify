const User = require("../models/User");
const CommonUtils = require("../utils/commonUtils");

// async function isUserExists(req, res, next) {
//     const { userId } = req.params;

//     try {
//         const isExists = await User.exists({ _id: userId });
//         if (!isExists) return res.status(400).json({ msg: "invalid User Id" });
//         next();
//     } catch (error) {
//         console.error(error.message);
//     }
// }

const isUserExists = CommonUtils.checkDocumentExists("User", "userId");

const validateUserId = CommonUtils.validateMongooseId("userId");

module.exports = { isUserExists, validateUserId }