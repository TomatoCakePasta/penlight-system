import express from 'express';
import { createServer } from "http";
import { Server } from "socket.io";
import sqlite3 from "sqlite3";
import cors from "cors";

const PORT = 3000;

const app = express();
const httpServer = createServer(app);

// dbオブジェクトの取得
const db = new sqlite3.Database("./panel_data.db", (err) => {
    if (err) {
        console.error("Failed to connect to databse:", err);
    }
    else {
        console.log("Connected to the SQLite database.");
    }
});

// 接続中のユーザー
let countUser = 0;

// ミドルウェア
app.use(cors({
    // 以下からのアクセスを許可
    // 全てからのアクセスを許可したい
    // origin: "192.168.0.10:5173",

    // これでも動いてる?
    origin: "*",

    // 許可するアクセス
    methods: ["GET", "POST"],
    // 許可するデータ
    allowedHeaders: ["Content-Type", "Authorization"],

    // セッションCookieを許可するために必要らしい
    credentials: true,
    // credentials: false,
}));

const io = new Server(httpServer, {
    cors: {
        origin: "*", // 許可したいオリジンを指定
        methods: ["GET", "POST"], // 許可したいHTTPメソッドを指定
        credentials: true // 認証情報の送信を許可する場合はtrueに設定
    }
});

app.get('/', (req, res) => {
    console.log("HOME URL");
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
        // console.log("GET changeColor : ", newColor);
        io.emit("changeColor", newColor);
    })

    socket.on("disconnect", () => {
        console.log("Disconnect client");
        countUser--;
        io.emit("exitClients", countUser);
    });

    socket.on("getClients", () => {
        // console.log("event getClients", countUser);
        io.emit("getClients", countUser);
    });
})

// TODO: apiファイルとか分割　MC
app.get("/song-list", (req, res) => {
    console.log("GET SONG LIST");
    const querry = `SELECT * FROM panels p
                        INNER JOIN songs s 
                        ON p.song_id = s.song_id
                        INNER JOIN colors c
                        ON p.color_id = c.color_id
                        INNER JOIN types t
                        ON c.type_id = t.type_id
                    ORDER BY p.sort_id
    `;

    db.serialize(() => {
        db.all(querry, (err, rows) => {
            if (!err) {
                const data = {
                    content: rows
                }
                console.log("GET SONG LIST", data);
                res.send({panels: data});
            }
            else {
                console.error("Database query error:", err);
                res.status(500);
            }
        })
    })
});

httpServer.listen(PORT, () => {
    console.log("Server is running ", PORT);
})