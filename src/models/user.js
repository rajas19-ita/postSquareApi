const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            trim: true,
            required: true,
        },
        email: {
            type: String,
            trim: true,
            required: true,
            lowercase: true,
            unique: true,
            validate(value) {
                if (!validator.isEmail(value)) {
                    throw new Error("Email is invalid!!");
                }
            },
        },
        password: {
            type: String,
            trim: true,
            minLength: [6, "password should be at least 6 characters"],
            required: true,
        },
        avatarUrl: {
            type: String,
        },
        avatarId: {
            type: String,
        },
        bio: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.avatarId;
    return userObject;
};

userSchema.methods.generateAuthToken = function () {
    const user = this;
    const token = jwt.sign(
        { _id: user._id.toString() },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: "1d",
        }
    );
    return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await userModel.findOne({ email });

    if (!user) {
        throw new Error("Unable to login!");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error("Unable to login!");
    }

    return user;
};

userSchema.pre("save", async function (next) {
    const user = this;
    if (user.isModified("password")) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
