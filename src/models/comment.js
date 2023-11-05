const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
    {
        comment: {
            type: String,
            required: true,
            trim: true,
        },
        author: {
            ref: "User",
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        post: {
            ref: "Post",
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

commentSchema.index({ post: 1, createdAt: -1 });

const commentModel = mongoose.model("Comment", commentSchema);

module.exports = commentModel;
