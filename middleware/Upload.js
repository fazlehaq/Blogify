const multer = require('multer')
const { v4 } = require('uuid')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, v4() + '-' + file.originalname);
    }
});

const fileFilter = function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
        const error = new Error('Only JPG, JPEG and PNG files are allowed');
        error.status = 400;
        return cb(error);
    }

    const maxSize = 5 * 1024 * 1024; // 5MB

    if (file.size > maxSize) {
        const error = new Error('File size must be less than 5MB');
        error.status = 400;
        return cb(error);
    }
    cb(null, true);
};

const limits = { fileSize: 5 * 1024 * 1024 };

const upload = multer({ storage, fileFilter, limits });



// delete the file

module.exports = upload;