const express = require('express');
const fs = require('fs');
const session = require('express-session');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: 'danzx-secret-key',
    resave: false,
    saveUninitialized: true
}));

const dbPath = path.join(__dirname, 'database.json');

// Helper membaca database
function readDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ users: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
}

// Helper menulis ke database
function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Auth Middleware
const auth = (req, res, next) => {
    if (req.session.loggedIn) return next();
    res.redirect('/login');
};

// Route Login
app.get('/login', (req, res) => res.render('login', { error: null }));
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') { // Ganti password di sini
        req.session.loggedIn = true;
        return res.redirect('/dashboard');
    }
    res.render('login', { error: 'Username atau Password salah!' });
});

// Route Dashboard
app.get('/dashboard', auth, (req, res) => {
    const db = readDB();
    res.render('dashboard', { users: db.users });
});

// Tambah Nomor
app.post('/add-user', auth, (req, res) => {
    const { phone, name, status } = req.body;
    const db = readDB();
    if (!db.users.find(u => u.phone === phone)) {
        db.users.push({ phone, name, status: status || 'Active', addedAt: new Date().toISOString() });
        writeDB(db);
    }
    res.redirect('/dashboard');
});

// Hapus Nomor
app.get('/delete-user/:phone', auth, (req, res) => {
    const db = readDB();
    db.users = db.users.filter(u => u.phone !== req.params.phone);
    writeDB(db);
    res.redirect('/dashboard');
});

// API endpoint untuk Bot WhatsApp membaca database
app.get('/api/users', (req, res) => {
    const db = readDB();
    res.json(db.users);
});

app.get('/', (req, res) => res.redirect('/login'));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
