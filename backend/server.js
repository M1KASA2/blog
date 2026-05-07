require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_liquid_glass_blog_key';
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Auth Route: Login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'Invalid credentials' });
        
        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token });
    });
});

// Articles Routes: Get all
app.get('/api/articles', (req, res) => {
    db.all(`SELECT id, title, SUBSTR(content, 1, 150) as excerpt, createdAt, updatedAt FROM articles ORDER BY createdAt DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Articles Routes: Search
app.get('/api/search', (req, res) => {
    const q = `%${req.query.q || ''}%`;
    db.all(`SELECT id, title, SUBSTR(content, 1, 200) as excerpt, createdAt 
            FROM articles 
            WHERE title LIKE ? OR content LIKE ? 
            ORDER BY createdAt DESC`,
        [q, q], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Articles Routes: Get single
app.get('/api/articles/:id', (req, res) => {
    db.get(`SELECT * FROM articles WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Not found' });
        res.json(row);
    });
});

// Articles Routes: Create (Protected)
app.post('/api/articles', authenticateToken, (req, res) => {
    const { title, content } = req.body;
    db.run(`INSERT INTO articles (title, content) VALUES (?, ?)`, [title, content], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// Articles Routes: Update (Protected)
app.put('/api/articles/:id', authenticateToken, (req, res) => {
    const { title, content } = req.body;
    db.run(`UPDATE articles SET title = ?, content = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, 
        [title, content, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ updated: this.changes });
    });
});

// Articles Routes: Delete (Protected)
app.delete('/api/articles/:id', authenticateToken, (req, res) => {
    db.run(`DELETE FROM articles WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});
// Settings Routes: Get single setting
app.get('/api/settings/:key', (req, res) => {
    db.get(`SELECT value FROM settings WHERE key = ?`, [req.params.key], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Not found' });
        res.json({ value: row.value });
    });
});

// Settings Routes: Update setting (Protected)
app.put('/api/settings/:key', authenticateToken, (req, res) => {
    const { value } = req.body;
    db.run(`INSERT INTO settings (key, value) VALUES (?, ?) 
            ON CONFLICT(key) DO UPDATE SET value = excluded.value`, 
        [req.params.key, value], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ updated: true });
    });
});

app.use(express.static(frontendDistPath));

app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
