// db.js
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: '185.158.107.135',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'money'
});

db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion :', err.stack);
        return;
    }
    console.log('Connecté à MySQL avec l\'ID', db.threadId);
});

module.exports = db;
