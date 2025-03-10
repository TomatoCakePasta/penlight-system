# Luminor (ルミナー)
あなたのスマホがペンライトに!!!  
スマホの画面をリアルタイムに一括制御し、手軽にライブを演出  

# DEMO

* お客さんは事前配布のQRなどからサイトにアクセス
* ライブが始まるとオペレータが会場の全ての端末を制御し一体感を演出

https://github.com/user-attachments/assets/aea8f809-e462-411e-b25d-610f8c83c254

性能: 100クライアントで最大9msほどで動作  
端末: スマホ, タブレット, PC全て可

イメージ  

![luminor_image](https://github.com/user-attachments/assets/3a493ebc-0cbb-4293-863f-43cf99600199)


# Features
「通信」をエンターテインメントに応用  
音楽ライブで購入する数千円のペンライトに負けない一体感をお手軽に実現  

### 背景
音楽ライブを企画する先輩からの相談で制作  
制作期間: 1ヶ月  

### 学び
* CSSの動的な書き換え, キーフレームでのアニメーションを習得
* 実際に人に使ってもらうアプリを制作
  (2024年2月の音楽ライブで100人の使用を予定)
* アジャイル開発で毎週プロトタイプを提示することで、顧客自身も曖昧な要望に素早く対応  
* インフラ周りの知識を習得(ドメイン取得, サーバーのカスタマイズ, SSL, ...)

# Requirement
* Node.js: v20.18.0
* bcrypt: 5.1.1 パスワードの暗号化
* cors: 2.8.5
* dotenv: 16.4.5 環境変数
* express: 4.21.1
* fs: 0.0.1-security
* https: 1.0.0 暗号化通信
* multer: 1.4.5-lts.1 ファイルアップロード
* path: 0.12.7
* socket.io: 4.8.1 双方向リアルタイム通信
* sqlite3: 5.1.7
* url: 0.11.4

### フロントエンド
* Vue.js
(フレームワークを活用して効率的にUIを作成)

### バックエンド
* Node.js / Express

### データベース
* SQLite
今回はデータ数が100件程度で小規模なのでSQLiteを使用

### ホスティング
* さくらVPS

# Installation
```bash
npm install
```

# Usage
初回:  
* DB Browser for SQLite等でdbファイルを開き、usersにユーザ名を登録

アプリの実行:  
フロントエンド側  
```bash
# cdコマンドでfrontendディレクトリに移動
npm run dev
```

バックエンド側  
```bash
# cdコマンドでbackendディレクトリに移動
node server.js
```

管理者画面は以下のパスにアクセスしてください
/login

初回はSignUpからusersに設定したユーザ名のパスワードを登録してください

# Vision
* 2024年2月に開催されるライブで100人程度の使用を予定
* Luminorで小規模なイベントでも新たな感動を創出
