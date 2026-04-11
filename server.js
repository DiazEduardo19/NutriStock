const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const path = require('path');

const app = express();

// --- CONFIGURACIÓN ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./')); 

app.use(session({
    secret: 'clave_secreta_suplementos',
    resave: false,
    saveUninitialized: true
}));

// --- CONEXIÓN A LA BASE DE DATOS ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'inventario_suplementos'
});

db.connect((err) => {
    if (err) throw err;
    console.log('✅ Conectado a MySQL');
});

// --- MIDDLEWARE PARA PROTEGER RUTAS ---
function verificarSesion(req, res, next) {
    if (req.session.usuarioId) {
        next();
    } else {
        // Si es una petición API y no hay sesión, mandamos un error 401
        if (req.path.startsWith('/suplementos')) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        res.redirect('/login');
    }
}

// --- RUTAS DE AUTENTICACIÓN ---
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', (req, res) => {
    const { usuario, password } = req.body;
    const query = 'SELECT * FROM usuarios WHERE usuario = ? AND password = ?';
    db.query(query, [usuario, password], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            req.session.usuarioId = results[0].id;
            res.redirect('/');
        } else {
            res.send('Usuario o contraseña incorrectos. <a href="/login">Volver</a>');
        }
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log("Error al cerrar sesión:", err);
            return res.redirect('/');
        }
        // Limpiamos la cookie del navegador (opcional pero recomendado)
        res.clearCookie('connect.sid'); 
        res.redirect('/login');
    });
});

// --- RUTAS DEL SISTEMA (CRUD Protegidas) ---

app.get('/', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 1. LEER (Read)
app.get('/suplementos', verificarSesion, (req, res) => {
    db.query('SELECT * FROM suplementos', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 2. CREAR (Create)
app.post('/suplementos', verificarSesion, (req, res) => {
    const { nombre, marca, precio, stock } = req.body;
    const query = 'INSERT INTO suplementos (nombre, marca, precio, stock) VALUES (?, ?, ?, ?)';
    db.query(query, [nombre, marca, precio, stock], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send('Agregado');
    });
});


// 3. ELIMINAR (Delete)
app.delete('/suplementos/:id', verificarSesion, (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM suplementos WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send('Eliminado');
    });
});

// 4. ACTUALIZAR (Update)
app.put('/suplementos/:id', verificarSesion, (req, res) => {
    const { id } = req.params;
    const { nombre, marca, precio, stock } = req.body;
    const query = 'UPDATE suplementos SET nombre=?, marca=?, precio=?, stock=? WHERE id=?';
    db.query(query, [nombre, marca, precio, stock, id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send('Actualizado');
    });
});

// --- INICIAR SERVIDOR ---
app.listen(3000, () => {
    console.log('🚀 Servidor en http://localhost:3000');
});