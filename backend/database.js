const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'blog.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        // Create Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`, (err) => {
            if (!err) {
                // Insert default admin if not exists
                db.get(`SELECT * FROM users WHERE username = ?`, ['admin'], (err, row) => {
                    if (!row) {
                        const hash = bcrypt.hashSync('admin123', 10);
                        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, ['admin', hash]);
                        console.log('Default admin user created: admin / admin123');
                    }
                });
            }
        });

        // Create Articles table
        db.run(`CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            content TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Create Settings table
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )`, (err) => {
            if (!err) {
                const defaultAbout =
                    '<p>欢迎访问我的个人网站！！</p>' +
                    '<p>我，一名自动化专业在读本科生。是个沉迷过去的明史爱好者，也是个偶尔挥两下拍子的羽毛球玩家。</p>' +
                    '<p>同时也是一名技术狂热分子，热爱嵌入式全栈、前后端开发以及机器人，喜欢折腾和研究各种好玩的新技术。</p>' +
                    '<p>这个小站是在我生日那天正式搭建上线的。对我而言，这里不仅是记录代码和日常的自留地，更是我在浩瀚互联网里的一块"数字墓碑"——用来铭记我在这世界折腾过的痕迹。</p>';
                db.get(`SELECT * FROM settings WHERE key = ?`, ['about_content'], (err, row) => {
                    if (!row) {
                        db.run(`INSERT INTO settings (key, value) VALUES (?, ?)`, ['about_content', defaultAbout]);
                        console.log('Default about content initialized.');
                    }
                });
            }
        });
    }
});

module.exports = db;
