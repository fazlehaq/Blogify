class ResourceNotFoundError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode || 404;
        this.stack = "";
    }
}


class InvalidInputError extends Error {
    constructor(message) {
        super(message);
        this.statusCode = 400;
        this.stack = "";

    }
}

class AuthenticationRequiredError extends Error {
    constructor(message = "Authentication required !") {
        super(message);
        this.statusCode = 401;
        this.stack = "";

    }
}

class AccessForbiddenError extends Error {
    constructor(message = "Access Forbidden !") {
        super(message);
        this.statusCode = 403;
        this.stack = "";

    }

}


module.exports = { ResourceNotFoundError, InvalidInputError, AuthenticationRequiredError, AccessForbiddenError };
