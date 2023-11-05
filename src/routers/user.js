const express = require("express");
const userModel = require("../models/user");
const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const imagekit = require("../config/imageKitConfig");
const notificationModel = require("../models/notification");

const userRouter = express.Router();

userRouter.get("/", async (req, res) => {
    try {
        const users = await userModel.find({});

        res.status(200).send(users);
    } catch (e) {
        res.status(400).send({ err: e.message });
    }
});

userRouter.post("/", async (req, res, next) => {
    try {
        const user = new userModel(req.body);
        await user.save();
        const token = user.generateAuthToken();
        res.status(201).send({ user, token });

        const users = await userModel.find({}, "_id");

        users.forEach(async (user1) => {
            const notification = new notificationModel({
                to: user1,
                from: user._id,
                type: "new_user",
            });

            await notification.save();
        });
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
            });
    },
    (err, req, res, next) => {
        res.status(400).send({ err: err.message });
    }
);

userRouter.get("/:id/notifications", auth, async (req, res) => {
    try {
        const timeStamp = req.query.timeStamp
            ? req.query.timeStamp
            : Date.now();

        const notifications = await notificationModel
            .find({
                to: req.user._id,
                createdAt: { $lt: timeStamp },
            })
            .limit(8)
            .populate("from", "username avatarUrl");

        res.status(200).send(notifications);
    } catch (e) {
        res.status(400).send({ err: e.message });
    }
});

module.exports = userRouter;
