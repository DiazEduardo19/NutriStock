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
        // Si es una petición de API devolvemos error, si es página redirigimos
        if (req.path.startsWith('/suplementos') || req.path.startsWith('/api-ventas')) {
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
            res.redirect('/menu'); 
        } else {
            res.send('Usuario o contraseña incorrectos. <a href="/login">Volver</a>');
        }
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid'); 
        res.redirect('/login');
    });
});

// --- RUTAS DE NAVEGACIÓN (HTML) ---
app.get('/', verificarSesion, (req, res) => res.redirect('/menu'));
app.get('/menu', verificarSesion, (req, res) => res.sendFile(path.join(__dirname, 'menu.html')));
app.get('/inventario', verificarSesion, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/ventas', verificarSesion, (req, res) => res.sendFile(path.join(__dirname, 'ventas.html')));

// --- RUTAS DE LA API (INVENTARIO) ---

// 1. OBTENER PRODUCTOS
app.get('/suplementos', verificarSesion, (req, res) => {
    db.query('SELECT * FROM suplementos', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 2. AGREGAR PRODUCTO (Esta te faltaba)
app.post('/suplementos', verificarSesion, (req, res) => {
    const { nombre, marca, precio, stock } = req.body;
    const query = 'INSERT INTO suplementos (nombre, marca, precio, stock) VALUES (?, ?, ?, ?)';
    db.query(query, [nombre, marca, precio, stock], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send('Producto agregado');
    });
});

// 3. ELIMINAR PRODUCTO
app.delete('/suplementos/:id', verificarSesion, (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM suplementos WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send('Eliminado');
    });
});

// 4. ACTUALIZAR PRODUCTO
app.put('/suplementos/:id', verificarSesion, (req, res) => {
    const { id } = req.params;
    const { nombre, marca, precio, stock } = req.body;
    const query = 'UPDATE suplementos SET nombre=?, marca=?, precio=?, stock=? WHERE id=?';
    db.query(query, [nombre, marca, precio, stock, id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send('Actualizado');
    });
});

// --- RUTAS DE LA API (VENTAS) ---

// 1. OBTENER HISTORIAL DE VENTAS (Para llenar la tabla)
app.get('/api-ventas', verificarSesion, (req, res) => {
    const sql = `
        SELECT v.*, s.nombre AS producto_nombre 
        FROM ventas v 
        JOIN suplementos s ON v.producto_id = s.id 
        ORDER BY v.fecha DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. REGISTRAR VENTA CON VALIDACIÓN DE STOCK
app.post('/api-ventas', verificarSesion, (req, res) => {
    const { producto_id, cantidad, total, cliente } = req.body;

    // Verificar si hay stock suficiente
    db.query('SELECT nombre, stock FROM suplementos WHERE id = ?', [producto_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Producto no encontrado" });

        const producto = results[0];
        if (producto.stock < cantidad) {
            return res.status(400).json({ error: `Stock insuficiente. Solo quedan ${producto.stock} unidades.` });
        }

        // Si hay stock, registrar la venta
        const sqlVenta = 'INSERT INTO ventas (producto_id, cantidad, total, cliente) VALUES (?, ?, ?, ?)';
        db.query(sqlVenta, [producto_id, cantidad, total, cliente], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            // Descontar del inventario
            const sqlStock = 'UPDATE suplementos SET stock = stock - ? WHERE id = ?';
            db.query(sqlStock, [cantidad, producto_id], (err, updateResult) => {
                if (err) return res.status(500).json({ error: err.message });
                res.status(200).json({ message: 'Venta registrada con éxito' });
            });
        });
    });
});

// --- INICIAR SERVIDOR ---
app.listen(3000, () => {
    console.log('🚀 Servidor NutriStock en http://localhost:3000');
});