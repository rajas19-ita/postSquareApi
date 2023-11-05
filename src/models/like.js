const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema(
    {
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

likeSchema.index({ postId: 1, userId: 1 }, { unique: true });

const likeModel = mongoose.model("Like", likeSchema);

module.exports = likeModel;
