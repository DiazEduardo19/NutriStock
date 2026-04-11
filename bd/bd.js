const mysql = require('mysql2');

const conexion = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Por defecto en XAMPP está vacío
    database: 'inventario_suplementos'
});

conexion.connect((err) => {
    if (err) {
        console.error('Error de conexión: ' + err.stack);
        return;
    }
    console.log('✅ Conectado a la BD de Suplementos');
});

module.exports = conexion;