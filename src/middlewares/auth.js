const jwt = require("jsonwebtoken");
const userModel = require("../models/user");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await userModel.findById(decoded._id);

    if (!user) {
      throw new Error("User not found!!");
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).send({ err: err.message });
  }
};

module.exports = auth;
