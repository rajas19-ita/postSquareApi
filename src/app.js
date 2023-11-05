const express = require("express");
require("./db/mongoose");
const jwt = require("jsonwebtoken");
const userModel = require("./models/user");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const usersSocket = {};

const postRouter = require("./routers/post");
const userRouter = require("./routers/user");

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
        origin: ["http://localhost:5173", "https://postsquare.onrender.com"],
    },
});

io.on("connection", async (socket) => {
    console.log("connection");
    console.log(socket.id);
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
            console.log("disconnection");
            console.log(socket.id);
            const arr = usersSocket[user._id] || null;
            if (!arr) return;

            const index = arr.indexOf(socket.id);
            arr.splice(index, 1);

            if (arr.length === 0) delete usersSocket[user._id];

            console.log(usersSocket);
        });
    } catch (err) {
        socket.disconnect();
    }
});

module.exports = { server };
