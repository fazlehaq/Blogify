const ErrorClasses = require("../errorClasses");
const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const User = require("../models/User");

const MODELS = {
    "Comment": Comment,
    "User": User
}

function checkDocumentExists(modelName, idParam) {
    return async function (req, res, next) {
        const id = req.params[idParam] || req.params[0];
        try {
            const document = await MODELS[modelName].exists({ _id: id });
            if (!document) {
                throw new ErrorClasses.ResourceNotFoundError(`${modelName} Not Found !`);
            }
            next();
        } catch (error) {
            next(error)
        }
    };
}

function validateMongooseId(idParam) {
    return async function (req, res, next) {
        const id = req.params[idParam] || req.params[0];
        const modelName = idParam.replace(/id/g, "");
        try {
            if (!id)
                throw new ErrorClasses.InvalidInputError(`Missing ${modelName} Id`);
            if (!mongoose.isValidObjectId(id))
                throw new ErrorClasses.InvalidInputError(`Invalid ${modelName} Id !`);
            return next();
        } catch (error) {
            next(error);
        }
    }
}


module.exports = { checkDocumentExists, validateMongooseId }