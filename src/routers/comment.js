const express = require("express");
const commentModel = require("../models/comment");
const auth = require("../middlewares/auth");

const commentRouter = express.Router({ mergeParams: true });

commentRouter.post("/", auth, async (req, res) => {
  try {
    const postId = req.params.postId;
    const comment = new commentModel({
      comment: req.body.comment,
      author: req.user._id,
      post: postId,
    });

    await comment.save();

    res.status(201).send(comment);
  } catch (err) {
    res.status(400).send({ err: err.message });
  }
});

commentRouter.get("/", auth, async (req, res) => {
  try {
    const postId = req.params.postId;
    const timeStamp = req.query.timeStamp ? req.query.timeStamp : Date.now();

    const comments = await commentModel
      .find({
        post: postId,
        createdAt: { $lt: timeStamp },
      })
      .sort({ createdAt: -1 })
      .limit(4)
      .populate("author", "avatarUrl username");

    res.status(200).send(comments);
  } catch (err) {
    res.status(400).send({ err: err.message });
  }
});

module.exports = commentRouter;
