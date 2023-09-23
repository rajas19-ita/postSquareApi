const multer = require("multer");

const upload = multer({
    limits: {
        fileSize: 2097152,
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpeg|jpg|png)$/)) {
            return cb(new Error("Please upload an image!!"));
        }

        cb(null, true);
    },
});

module.exports = upload;
