const express = require("express");
const commentModel = require("../models/comment");
const auth = require("../middlewares/auth");
const notificationModel = require("../models/notification");
const postModel = require("../models/post");

const commentRouter = express.Router({ mergeParams: true });

commentRouter.post("/", auth, async (req, res) => {
    try {
        const postId = req.params.postId;
        const post = await postModel.findById(postId);

        if (!post) {
            return res.status(404).send({ err: "post not found!" });
        }

        const comment = new commentModel({
            comment: req.body.comment,
            author: req.user._id,
            post: postId,
        });

        await comment.save();

        res.status(201).send(comment);
        if (!post.author.equals(req.user._id)) {
            const notification = new notificationModel({
                to: post.author,
                from: req.user._id,
                postId,
                commentId: comment._id,
                type: "comment",
            });

            await notification.save();
        }
    } catch (err) {
        res.status(400).send({ err: err.message });
    }
});

commentRouter.get("/:id", auth, async (req, res) => {
    try {
        const commentId = req.params.id;
        const comment = await commentModel
            .findById(commentId)
            .populate("author", "avatarUrl username");

        if (!comment) {
            return res.status(404).send("Comment not Found!");
        }

        res.status(200).send(comment);
    } catch (e) {
        res.status(400).send({ err: e.message });
    }
});

commentRouter.get("/", auth, async (req, res) => {
    try {
        const postId = req.params.postId;
        const timeStamp = req.query.timeStamp
            ? req.query.timeStamp
            : Date.now();
        const exceptCommentId = req.query.except || null;
        var comments = null;

        if (!exceptCommentId) {
            comments = await commentModel
                .find({
                    post: postId,
                    createdAt: { $lt: timeStamp },
                })
                .limit(4)
                .populate("author", "avatarUrl username");
        } else {
            comments = await commentModel
                .find({
                    _id: { $ne: exceptCommentId },
                    post: postId,
                    createdAt: { $lt: timeStamp },
                })
                .limit(4)
                .populate("author", "avatarUrl username");
        }

        res.status(200).send(comments);
    } catch (err) {
        res.status(400).send({ err: err.message });
    }
});

module.exports = commentRouter;
