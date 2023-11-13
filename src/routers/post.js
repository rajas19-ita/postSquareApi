const express = require("express");
const postModel = require("../models/post");
const likeModel = require("../models/like");

const upload = require("../middlewares/upload");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const auth = require("../middlewares/auth");
const commentRouter = require("./comment");
const imagekit = require("../config/imageKitConfig");
const notificationModel = require("../models/notification");
const userModel = require("../models/user");

const postRouter = express.Router();

postRouter.post(
    "/",
    auth,
    upload.single("postImage"),
    async (req, res) => {
        const imageName = uuidv4() + ".webp";
        await sharp(req.file.buffer)
            .resize({
                width: 896,
                fit: "contain",
            })
            .webp({ quality: 75 })
            .toBuffer()
            .then((outputBuffer) => {
                imagekit
                    .upload({
                        file: outputBuffer,
                        fileName: imageName,
                        folder: "/post_Images",
                    })
                    .then((response) => {
                        const post = new postModel({
                            caption: req.body.caption,
                            imageUrl: response.url,
                            author: req.user._id,
                            likes: 0,
                            aspect: req.body.aspect,
                        });
                        return post.save();
                    })
                    .then((post) => {
                        res.status(201).send(post);

                        userModel.find({}, "_id").then((users) => {
                            users.forEach((user1) => {
                                if (!user1.equals(req.user._id)) {
                                    const notification = new notificationModel({
                                        to: user1,
                                        from: req.user._id,
                                        postId: post._id,
                                        type: "post",
                                    });

                                    notification.save();
                                }
                            });
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

postRouter.get("/:id", auth, async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await postModel
            .findById(postId)
            .populate("author", "avatarUrl username");

        if (!post) {
            return res.status(404).send("Post not Found!");
        }

        res.status(200).send(post);
    } catch (e) {
        res.status(400).send({ err: e.message });
    }
});

postRouter.get("/", auth, async (req, res) => {
    try {
        const timeStamp = req.query.timeStamp
            ? req.query.timeStamp
            : Date.now();

        const posts = await postModel
            .find({ createdAt: { $lt: timeStamp } })
            .limit(4)
            .populate("author", "avatarUrl username");

        const postData = [];

        for (const post of posts) {
            let hasLiked = false;

            const like = await likeModel.findOne({
                postId: post._id,
                userId: req.user._id,
            });

            if (like) {
                hasLiked = true;
            }

            postData.push({
                ...post.toObject(),
                hasLiked,
            });
        }
        res.status(200).send(postData);
    } catch (err) {
        res.status(500).send({ err: err.message });
    }
});

postRouter.post("/:id/likes", auth, async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await postModel.findById(postId);

        if (!post) {
            return res.status(404).send({ err: "post not found!" });
        }

        const like = new likeModel({ postId, userId: req.user._id });

        await like.save();

        post.likes++;

        await post.save();

        res.status(200).send({ likes: post.likes });

        if (!post.author.equals(req.user._id)) {
            const arr = req.usersSocket[post.author] || null;

            const notification = new notificationModel({
                to: post.author,
                from: req.user._id,
                postId,
                type: "like",
            });

            await notification.save();

            if (arr) {
                arr.forEach((socketId) =>
                    req.io.to(socketId).emit("notification", {
                        username: req.user.username,
                        postId,
                        type: "like",
                    })
                );
            }
        }
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).send({ err: "Already liked!" });
        }
        res.status(400).send({ err: err.message });
    }
});

postRouter.delete("/:id/likes", auth, async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await postModel.findById(postId);

        if (!post) {
            return res.status(404).send({ err: "post not found!" });
        }

        const like = await likeModel.findOneAndDelete({
            postId,
            userId: req.user._id,
        });

        if (!like) {
            return res.status(404).send({ err: "Like not found!" });
        }

        post.likes--;

        await post.save();

        res.status(200).send({ likes: post.likes });

        if (!post.author.equals(req.user._id)) {
            const notification = await notificationModel.findOneAndDelete({
                postId,
                from: req.user._id,
                type: "like",
            });
        }
    } catch (err) {
        res.status(400).send({ err: err.message });
    }
});

postRouter.use("/:postId/comments", commentRouter);

module.exports = postRouter;
