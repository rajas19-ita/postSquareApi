const express = require("express");
const postModel = require("../models/post");
const likeModel = require("../models/like");
const upload = require("../middlewares/upload");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const auth = require("../middlewares/auth");
const commentRouter = require("./comment");
const { ref, uploadBytes, getDownloadURL } = require("firebase/storage");
const { storage } = require("../firebase");

const postRouter = express.Router();

postRouter.post(
  "/",
  auth,
  upload.single("postImage"),
  async (req, res) => {
    const imageName = uuidv4() + ".jpg";

    await sharp(req.file.buffer)
      .jpeg({ quality: 80 })
      .toBuffer()
      .then((outputBuffer) => {
        const metadata = {
          contentType: "image/jpeg",
        };

        const imageRef = ref(storage, `postImage/${imageName}`);

        uploadBytes(imageRef, outputBuffer, metadata).then((snapshot) => {
          getDownloadURL(imageRef)
            .then((url) => {
              const post = new postModel({
                caption: req.body.caption,
                imageUrl: url,
                author: req.user._id,
                likes: 0,
              });
              return post.save();
            })
            .then((post) => {
              res.status(201).send(post);
            });
        });
      });
  },
  (err, req, res, next) => {
    res.status(400).send({ err: err.message });
  }
);

postRouter.get("/", auth, async (req, res) => {
  try {
    const timeStamp = req.query.timeStamp ? req.query.timeStamp : Date.now();

    const posts = await postModel
      .find({ createdAt: { $lt: timeStamp } })
      .sort({ createdAt: -1 })
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
  } catch (err) {
    res.status(400).send({ err: err.message });
  }
});

postRouter.use("/:postId/comments", commentRouter);

module.exports = postRouter;
