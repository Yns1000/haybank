// db.js
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'Money'
});

db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion :', err.stack);
        return;
    }
    console.log('Connecté à MySQL avec l\'ID', db.threadId);
});

module.exports = db;
