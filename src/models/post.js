const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        caption: {
            type: String,
            required: true,
            trim: true,
        },
        imageUrl: {
            type: String,
            required: true,
        },
        author: {
            ref: "User",
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        likes: {
            type: Number,
            default: 0,
        },
        aspect: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

postSchema.index({ createdAt: -1 });

const postModel = mongoose.model("Post", postSchema);

module.exports = postModel;
