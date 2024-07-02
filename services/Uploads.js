const fs = require('fs')
const path = require('path');

function deleteFile(filePath) {
    return fs.promises.unlink(filePath)
}

function stripDoubleBackSlashes(path) {
    return path.replace(/\/\/+/g, '/');
}

module.exports = { deleteFile, stripDoubleBackSlashes };
