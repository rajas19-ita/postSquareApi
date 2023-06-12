const express = require("express");
require("./db/mongoose");
const cors = require("cors");

const postRouter = require("./routers/post");
const userRouter = require("./routers/user");

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/users", userRouter);
app.use("/posts", postRouter);

module.exports = app;
