const ErrorClasses = require("../errorClasses");

function ErrorMiddleware(error, req, res, next) {
    console.log(error)
    if (error instanceof ErrorClasses.ResourceNotFoundError) {
        return res.status(error.statusCode).json({ error: error.message });
    }
    else if (error instanceof ErrorClasses.InvalidInputError) {
        return res.status(error.statusCode).json({ error: error.message });
    }
    else if (error instanceof ErrorClasses.AuthenticationRequiredError) {
        return res.status(error.statusCode).json({ error: error.message });
    }
    else if (error instanceof ErrorClasses.AccessForbiddenError) {
        return res.status(error.statusCode).json({ error: error.message });
    }
    else if (error.code == "11000") {
        const duplicateKeys = Object.keys(error.keyValue);
        return res.status(409).json({ error: `${duplicateKeys} Must Be Unique` });
    }
    else if (error.name == "CastError") {
        return res.status(400).json({ error: 'Invalid Id !' })
    }
    else {
        res.status(500).json({ error: "Internal Server Error" })
    }
}

module.exports = ErrorMiddleware;
