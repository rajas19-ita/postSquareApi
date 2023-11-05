const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        to: {
            ref: "User",
            type: mongoose.Schema.Types.ObjectId,
        },
        from: {
            ref: "User",
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        postId: {
            ref: "Post",
            type: mongoose.Schema.Types.ObjectId,
        },
        commentId: {
            ref: "Comment",
            type: mongoose.Schema.Types.ObjectId,
        },
        type: {
            type: String,
            enum: ["like", "comment", "post", "new_user"],
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

notificationSchema.index({ to: 1, createdAt: -1 });
notificationSchema.index({ postId: 1, from: 1 });

const notificationModel = mongoose.model("Notification", notificationSchema);

module.exports = notificationModel;
