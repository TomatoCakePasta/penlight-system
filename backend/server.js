import express from 'express';
import { createServer } from "http";
import { Server } from "socket.io";
import sqlite3 from "sqlite3";
import cors from "cors";
import https from "https";
import fs from 'fs';
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import multer from 'multer';
import path from "path";
import { fileURLToPath } from "url";

// ********* 重要 ************
// SSL証明書は3ヶ月で切れるから更新必須

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

const PORT = process.env.PORT || 3000;

const app = express();
// const httpServer = createServer(app);

// httpリクエストをhttpsにリダイレクト
// createServer(app).listen(3002, () => {
//     console.log("HTTP Server running on port 80");
// });

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 静的ファイルを提供
// パス名はカレントディレクトリにimagesを追記したパス
app.use("/images", express.static(path.join(__dirname, "images")));

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

let server;
let protocol = "";

console.log(`Environment: ${process.env.NODE_ENV}`);

// 本番環境
if (process.env.NODE_ENV === "production") {
    const url = process.env.URL;

    const options = {
        key: fs.readFileSync(`../../../etc/letsencrypt/live/${url}/privkey.pem`),
        cert: fs.readFileSync(`../../../etc/letsencrypt/live/${url}/cert.pem`),
    }

    server = https.createServer(options, app);

    protocol = "HTTPS";
}
else {
    server = createServer(app);
    protocol = "HTTP";
}

// const io = new Server(httpServer, {
const io = new Server(server, {
    cors: {
        origin: "*", // 許可したいオリジンを指定
        methods: ["GET", "POST"], // 許可したいHTTPメソッドを指定
        credentials: true // 認証情報の送信を許可する場合はtrueに設定
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images/");
    },
    filename: (req, file, cb) => {
        const decodeName = decodeURIComponent(file.originalname);
        cb(null, decodeName);
    }
})

// 画像
const upload = multer({ storage });

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
         const date = Date.now();
        // console.log("GET changeColor : ", newColor);
        io.emit("changeColor", [newColor, date]);
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

app.post("/signup", (req, res) => {
    const { name, rawPass } = req.body;

    // ハッシュ化
    const hashedPass = bcrypt.hashSync(rawPass, 10);

    console.log("POST SIGN UP");
    // console.log(name, rawPass, hashedPass);

    // あらかじめ設定した規程ユーザか確認
    const query = `SELECT user_id FROM users WHERE name = ?`;

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        db.get(query, [ name ], (err2, res2) => {
            if (err2) {
                db.run("ROLLBACK");
                res.send({ flag: false });
                return console.error("Failed to search user:", err2);
            }

            // 規程ユーザの場合
            if (res2) {
                // 新規データ挿入
                const query2 = `UPDATE users SET hashed_pass = ? WHERE user_id = ?`;

                db.run(query2, [ hashedPass, res2.user_id ], (err3) => {
                    if (err3) {
                        db.run("ROLLBACK");
                        res.send({ flag: false });
                        return console.error("Failed to update user pass:", err3);
                    }

                    db.run("COMMIT");
                    console.log("Update user pass");
                    res.send({ flag: true });
                });
            }
            else {
                db.run("ROLLBACK");
                console.error("Username Doesn't exist");
                res.send({ flag: false });
            }
        });
    });
});

app.post("/login", (req, res) => {
    const { name, rawPass } = req.body;

    const query = `SELECT hashed_pass FROM users WHERE name = ?`;

    // console.log(name);
    console.log("POST LOG IN");

    db.serialize(() => {
        // 一致するユーザのパスを取得
        db.get(query, [ name ], (err2, res2) => {
            if (res2) {
                // console.log(res2.hashed_pass);
                if (bcrypt.compareSync(rawPass, res2.hashed_pass)) {
                    console.log("OK");
                    const session = { name: name }
                    return res.status(200).send({ flag: true, session });
                }
                else {
                    console.log("NO MATCH");
                    return res.send({ flag: false });
                }
            }
            else {
                console.log(res2);
                return res.send({ flag: false });
            }
        })
    });
});

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
                        image_name,
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
app.post("/save-panel", upload.array("image"), (req, res) => {    
    const panelsData = JSON.parse(req.body.data);

    const files = req.files;

    console.log(panelsData);
    console.log(files);

    // console.log(panelsData);
    console.log("POST SAVE PANEL");

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        
        panelsData.forEach((panel) => {
            const { sort_id, panel_id, type_id, color, message, sub_message, speed, angle, label, image_name } = panel;

            // console.log(sort_id, panel_id, type_id, color, message, sub_message, speed, angle, label );

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
                                label = ?,
                                image_name = ?
                            WHERE panel_id = ?
                        `;

            db.run(query2, [ type_id, color, message, sub_message, speed, angle, label, image_name, panel_id ]);
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

app.post("/del-image", (req, res) => {
    const { panel_id, image_name } = req.body;

    console.log("POST del-image");

    fs.unlink(`images/${ image_name }`, (err) => {
        if (err) {
            console.error("Failed to delete image:", err);
        }

        const query1 = `
            UPDATE panels
            SET image_name = ?
            WHERE panel_id = ?
        `;

        db.run(query1, [ '', panel_id ], (err) => {
            if (err) {
                console.error("Failed to clear image_name:", err);
            }
            res.send({ flag: true });
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
    // console.log(song_id);

    const query = `SELECT COALESCE(MAX(sort_id), 0) AS sort_id FROM panels WHERE song_id = ?`;

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // 現在の曲中の中で最大ソート値を取得
        db.get(query, [ song_id ], (err, res2) => {
            if (err) {
                return console.error("Failed to get sort_id", err);
            }

            // console.log("sort_id:", res2.sort_id);

            const query2 = `INSERT INTO panels (sort_id, song_id) VALUES(?, ?)`;

            // 新規panelを作成
            db.run(query2, [ res2.sort_id + 1, song_id ]);

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
// TODO: 画像も消す
app.post("/del-panel", (req, res) => {
    const { panel_id, image_name } = req.body;

    const query = `DELETE FROM panels WHERE panel_id = ?`;

    // const query = `DELETE FROM panels WHERE panel_id = ?`;

    console.log("DEL PANEL", panel_id)

    fs.unlink(`images/${ image_name }`, (err) => {
        if (err) {
            console.error("Failed to delete image:", err);
        }
    });

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

// セットリスト追加
app.post("/add-song", (req, res) => {
    const { title, artist } = req.body;

    // sort_idを取得
    const query = `SELECT COALESCE(MAX(sort_id), 0) AS sort_id FROM songs`;

    console.log("POST ADD SONG");
    // console.log(title, artist);

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // 現在の曲中の中で最大ソート値を取得
        db.get(query, (err, res2) => {
            if (err) {
                return console.error("Failed to get sort_id", err);
            }

            // console.log("sort_id:", res2.sort_id);

            const query2 = `INSERT INTO songs (sort_id, title, artist) VALUES(?, ?, ?)`;

            // 新規panelを作成
            db.run(query2, [ res2.sort_id + 1, title, artist ]);

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
})

// 並び順更新
app.post("/save-song-sort", (req, res) => {
    const songsData = req.body;

    // console.log(songsData);
    console.log("POST SAVE SORT SONG");

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        
        songsData.forEach((song) => {
            const { sort_id, song_id} = song;

            // console.log(sort_id, song_id);

            // 並び順の更新
            const query1 = `
                            UPDATE songs
                            SET sort_id = ?
                            WHERE song_id = ?
                        `;

            db.run(query1, [ sort_id, song_id ]);
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

// セットリスト更新
app.post("/save-song", (req, res) => {
    const { song_id, title, artist, sort_id } = req.body;

    console.log("POST SAVE SONG");
    // console.log(song_id, title, artist, sort_id);

    // 指定idのレコードを更新
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        const query1 = `
                        UPDATE songs
                        SET 
                            title = ?,
                            artist = ?,
                            sort_id = ?
                        WHERE song_id = ?
                    `;

        db.run(query1, [ title, artist, sort_id, song_id ]);

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

// セットリスト削除
app.post("/del-song", (req, res) => {
    const { song_id } = req.body;
    const image_namses = req.body.image_names;

    const query = `DELETE FROM songs WHERE song_id = ?`;

    console.log("POST DEL SONG");

    console.log(image_namses);

    image_namses.forEach((image_name) => {
        fs.unlink(`images/${ image_name }`, (err) => {
            if (err) {
                console.error("Failed to delete image files", err);
            }
            console.log("Delete ", image_name);
        });
    })

    console.log("Run delete song query");
    // TODO: 保存した画像も削除
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        db.run(query, [ song_id ], (err) => {
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

server.listen(PORT, () => {
    console.log(`${protocol} Server is running on port ${PORT}`);
});

// httpsServer.listen(PORT, () => {
//     console.log(`HTTPS Server running on port ${PORT}`);
// });

// httpServer.listen(PORT, () => {
//     console.log("Server is running ", PORT);
// })