const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.resolve(__dirname, 'blog.sqlite'));

const content = '<p>欢迎访问我的个人网站！！</p>' +
'<p>我，一名自动化专业在读本科生。是个沉迷过去的明史爱好者，也是个偶尔挥两下拍子的羽毛球玩家。</p>' +
'<p>同时也是一名技术狂热分子，热爱嵌入式全栈、前后端开发以及机器人，喜欢折腾和研究各种好玩的新技术。</p>' +
'<p>这个小站是在我生日那天正式搭建上线的。对我而言，这里不仅是记录代码和日常的自留地，更是我在浩瀚互联网里的一块"数字墓碑"——用来铭记我在这世界折腾过的痕迹。</p>';

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)', (err) => {
    if (err) { console.error('Create table error:', err.message); return; }
    db.run(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      ['about_content', content],
      function(err) {
        if (err) { console.error('Error:', err.message); }
        else { console.log('About content updated successfully!'); }
        db.close();
      }
    );
  });
});
