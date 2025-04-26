
const pool = require('../../warehouse-management-API/database');

const mysql = require('mysql2/promise'); // Use promise wrapper

// Load environment variables
require('dotenv').config(); // Make sure dotenv is loaded to read .env file

console.log('Creating database pool with config:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
// Avoid logging password in production!
// console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);


const pool = mysql.createPool({
   host: process.env.DB_HOST || 'localhost', // Default added for safety
   user: process.env.DB_USER, // Require user from env
   password: process.env.DB_PASSWORD, // Require password from env
   database: process.env.DB_NAME, // Require database name from env
   waitForConnections: true,
   connectionLimit: process.env.DB_CONNECTION_LIMIT || 10, // Allow override via env
   queueLimit: 0
 });

// Optional: Test connection on startup (can add more robust checks)
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to the database.');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to the database:', err);
        // Consider exiting if the DB connection is critical for startup
        // process.exit(1);
    });

module.exports = pool;

// --- Alternatively, if pool creation was in mainserver.js originally ---
// const mysql = require('mysql2/promise'); // Or require('mysql2') if not using promises extensively

// const pool = mysql.createPool({
//    host: process.env.DB_HOST || 'localhost',
//    user: process.env.DB_USER || 'root',
//    password: process.env.DB_PASSWORD || '',
//    database: process.env.DB_NAME || 'xicorana',
//    waitForConnections: true,
//    connectionLimit: 10,
//    queueLimit: 0
//  });

// module.exports = pool;
// --- End Alternative --- 