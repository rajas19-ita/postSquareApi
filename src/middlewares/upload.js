const multer = require("multer");

const upload = multer({
    limits: {
        fileSize: 5242880,
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpeg|jpg|png)$/)) {
            return cb(new Error("Please upload an image!!"));
        }

        cb(null, true);
    },
});

module.exports = upload;
