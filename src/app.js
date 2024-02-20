const express = require("express");
require("./db/mongoose");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const userModel = require("./models/user");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const usersSocket = {};

const postRouter = require("./routers/post");
const userRouter = require("./routers/user");

const app = express();

app.use(
    cors({
        origin: "*",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true,
    })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
    req.io = io;
    req.usersSocket = usersSocket;
    next();
});

app.use("/users", userRouter);
app.use("/posts", postRouter);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

io.on("connection", async (socket) => {
    try {
        const token = socket.handshake.query.token;

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await userModel.findById(decoded._id);

        if (!user) {
            throw new Error("User not found!!");
        }

        const arr = usersSocket[user._id] || null;
        if (!arr) {
            usersSocket[user._id] = [socket.id];
        } else {
            arr.push(socket.id);
        }
        socket.on("disconnect", () => {
            const arr = usersSocket[user._id] || null;
            if (!arr) return;

            const index = arr.indexOf(socket.id);
            arr.splice(index, 1);

            if (arr.length === 0) delete usersSocket[user._id];
        });
    } catch (err) {
        socket.disconnect();
    }
});

module.exports = { server };
