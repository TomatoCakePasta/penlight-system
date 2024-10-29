import express from 'express';
import { createServer } from "http";
import { Server } from "socket.io";

const PORT = 3000;

const app = express();
const httpServer = createServer(app);

// TODO: 接続中のユーザ
let countUser = 0;

const io = new Server(httpServer, {
    cors: {
        origin: "*", // 許可したいオリジンを指定
        methods: ["GET", "POST"], // 許可したいHTTPメソッドを指定
        credentials: true // 認証情報の送信を許可する場合はtrueに設定
    }
});

app.get('/', (req, res) => {
  res.send("HELLO NODEJS");
});

io.on("connection", (socket) => {
    console.log("connect client");
    countUser++;  
    // クライアントに送信
    socket.emit("enterClient", countUser);  

    socket.on("message", () => {
        console.log("Hello event");
        const msg = "res message";
        io.emit("hello", msg);
    });

    socket.on("changeColor", (newColor) => {
        console.log("GET changeColor : ", newColor);
        io.emit("changeColor", newColor);
    })

    socket.on("disconnect", () => {
        console.log("Disconnect client");
        countUser--;
        io.emit("exitClients", countUser);
    });

    socket.on("getClients", () => {
        console.log("event getClients", countUser);
        io.emit("getClients", countUser);
    });
})

httpServer.listen(PORT, () => {
    console.log("Server is running ", PORT);
})