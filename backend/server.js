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
        // 外部キーを有効にする
        db.run("PRAGMA foreign_keys = ON;", (err) => {
            if (err) {
                console.error("ERROR ENABLING FOREIGN KEYS:", err);
            } else {
                console.log("FOREIGN KEYS ENABLED");
            }
        });
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

// JSON形式のリクエストボディをパース
app.use(express.json());

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
         console.log("Change Color");
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
// TODO: 選択した曲のパネルのみ取得
app.get("/panel/:id", (req, res) => {
    const song_id = req.params.id;

    console.log("GET PANEL DATA");
    const query = `
                    SELECT 
                        panel_id,
                        p.sort_id,
                        title,
                        artist,
                        color,
                        message,
                        sub_message,
                        speed,
                        angle,
                        label,
                        t.type_id,
                        name AS type
                    FROM panels p
                        INNER JOIN songs s 
                        ON p.song_id = s.song_id
                        INNER JOIN types t
                        ON p.type_id = t.type_id
                    WHERE p.song_id = ?
                    ORDER BY p.sort_id
                `;

    db.serialize(() => {
        db.all(query, [song_id], (err, rows) => {
            if (!err) {
                const data = {
                    content: rows
                }
                // console.log("GET PANEL DATA", data);
                res.send({panels: data});
            }
            else {
                console.error("Database query error:", err);
                res.status(500);
            }
        })
    })
});

// パネル更新
app.post("/save-panel", (req, res) => {    
    const panelsData = req.body;

    console.log(panelsData);

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        
        panelsData.forEach((panel) => {
            const { sort_id, panel_id, type_id, color, message, sub_message, speed, angle, label } = panel;

            console.log(sort_id, panel_id, type_id, color, message, sub_message, speed, angle, label );

            // 並び順の更新
            const query1 = `
                            UPDATE panels
                            SET sort_id = ?
                            WHERE panel_id = ?
                        `;

            db.run(query1, [ sort_id, panel_id ]);

            // 色情報の更新
            const query2 = `
                            UPDATE panels
                            SET 
                                type_id = ?,
                                color = ?,
                                message = ?,
                                sub_message = ?,
                                speed = ?,
                                angle = ?,
                                label = ?
                            WHERE panel_id = ?
                        `;

            db.run(query2, [ type_id, color, message, sub_message, speed, angle, label, panel_id ]);
        });

        db.run("COMMIT", (err) => {
            if (err) {
                console.error("ERROR: ", err);
                res.status(500).send("SERVER ERROR");
            }
            else {
                res.status(200).send("UPDATED DATA");
            }
        });
    });
    
});

app.get("/song-list", (req, res) => {
    console.log("GET SONG LIST");
    const query = `
                    SELECT 
                        song_id,
                        title,
                        artist,
                        sort_id
                    FROM songs
                    ORDER BY sort_id
                `;

    db.serialize(() => {
        db.all(query, (err, rows) => {
            if (!err) {
                const data = {
                    content: rows
                }
                // console.log("GET SONG LIST", data);
                res.send({songs: data});
            }
            else {
                console.error("Database query error:", err);
                res.status(500);
            }
        })
    })
});

app.get("/type", (req, res) => {
    console.log("GET TYPE DATA");

    const query = `
                    SELECT name
                    FROM types
                    ORDER BY type_id
                `;

    db.serialize(() => {
        db.all(query, (err, rows) => {
            if (!err) {
                const data = {
                    content: rows
                }
                // console.log("GET TYPE DATA", data);
                res.send({types: data});
            }
            else {
                console.error("Database query error:", err);
                res.status(500);
            }
        })
    })
});

// 新規パネル作成
app.post("/add-panel", (req, res) => {
    const { song_id } = req.body;

    console.log("add-panel");
    console.log(song_id);

    const query = `SELECT COALESCE(MAX(sort_id), 0) AS sort_id FROM panels WHERE song_id = ?`;

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // 現在の曲中の中で最大ソート値を取得
        db.get(query, [ song_id ], (err, res) => {
            if (err) {
                return console.error("Failed to get sort_id", err);
            }

            console.log("sort_id:", res.sort_id);

            const query2 = `INSERT INTO panels (sort_id, song_id) VALUES(?, ?)`;

            // 新規panelを作成
            db.run(query2, [ res.sort_id + 1, song_id ]);

        })

        db.run("COMMIT", (err) => {
            if (err) {
                console.error("ERROR: ", err);
                res.status(500).send("SERVER ERROR");
            }
            else {
                res.status(200).send("UPDATED DATA");
            }
        });
    })

});

// パネル削除
app.post("/del-panel", (req, res) => {
    const { panel_id } = req.body;

    const query = `DELETE FROM panels WHERE panel_id = ?`;

    // const query = `DELETE FROM panels WHERE panel_id = ?`;

    console.log("DEL PANEL", panel_id)

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
      
        // 指定のカラーパネルを削除
        // 親のcolorsを削除すると該当するpanelsのレコードも自動削除
        db.run(query, [ panel_id ], (err) => {
            if (err) {
                console.error("Failed deleting data:", err);
                db.run("ROLLBACK");
                return res.status(500).send("DELETE ERROR");
            }

            db.run("COMMIT", (err) => {
                if (err) {
                    console.error("ERROR: ", err);
                    res.status(500).send("SERVER ERROR");
                }
                else {
                    res.status(200).send(true);
                }
            });
            
        });

    })

});

httpServer.listen(PORT, () => {
    console.log("Server is running ", PORT);
})