const express = require("express");
const userModel = require("../models/user");
const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const imagekit = require("../config/imageKitConfig");

const userRouter = express.Router();

userRouter.post("/", async (req, res, next) => {
    try {
        const user = new userModel(req.body);
        await user.save();
        const token = user.generateAuthToken();
        res.status(201).send({ user, token });
    } catch (err) {
        if (err.code === 11000) {
            return res
                .status(400)
                .send({ err: "Email address is already taken!" });
        }
        res.status(400).send({ err: err.message });
    }
});

userRouter.post("/login", async (req, res, next) => {
    try {
        if (!req.body.email || !req.body.password) {
            const field = req.body.email ? "password" : "email";
            return new Error(`${field} field is empty...`);
        }
        const user = await userModel.findByCredentials(
            req.body.email,
            req.body.password
        );
        const token = user.generateAuthToken();

        res.status(200).send({ user, token });
    } catch (err) {
        res.status(400).send({ err: err.message });
    }
});

userRouter.patch(
    "/me/avatar",
    auth,
    upload.single("avatar"),
    async (req, res) => {
        // if (req.user.avatarUrl) {
        //     const regex = /%2F([^?]+)/;
        //     const match = req.user.avatarUrl.match(regex);
        //     const deleteRef = ref(storage, `avatar/${match[1]}`);

        //     deleteObject(deleteRef);
        // }
        if (req.user.avatarUrl) {
            imagekit.deleteFile(req.user.avatarId).catch((error) => {
                console.log(error);
            });
        }

        const avatarName = uuidv4() + ".webp";

        await sharp(req.file.buffer)
            .resize({
                width: 254,
                height: 254,
            })
            .webp({ quality: 75 })
            .toBuffer()
            .then((outputBuffer) => {
                imagekit
                    .upload({
                        file: outputBuffer,
                        fileName: avatarName,
                        folder: "/avatar",
                    })
                    .then((response) => {
                        req.user.avatarUrl = response.url;
                        req.user.avatarId = response.fileId;
                        return req.user.save();
                    })
                    .then(() => {
                        res.status(200).send({
                            avatarUrl: req.user.avatarUrl,
                        });
                    })
                    .catch((error) => {
                        console.log(error);
                    });
                // const metadata = {
                //     contentType: "image/webp",
                // };
                // const avatarRef = ref(storage, `avatar/${avatarName}`);
                // uploadBytes(avatarRef, outputBuffer, metadata).then(
                //     (snapshot) => {
                //         getDownloadURL(avatarRef)
                //             .then((url) => {
                //                 req.user.avatarUrl = url;
                //                 return req.user.save();
                //             })
                //             .then(() => {
                //                 res.status(200).send({
                //                     avatarUrl: req.user.avatarUrl,
                //                 });
                //             });
                //     }
                // );
            });
    },
    (err, req, res, next) => {
        res.status(400).send({ err: err.message });
    }
);

module.exports = userRouter;
