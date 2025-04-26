const app = require('./src/app');
// Consider using dotenv for environment variables
// require('dotenv').config(); 

const PORT = process.env.PORT || 5000;

// Start the server (using HTTP as HTTPS was commented out in original)
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// --- Original HTTPS setup (if needed later) ---
// const https = require('https');
// const fs = require('fs');
// const path = require('path');

// try {
//     // Adjust paths relative to the project root (where server.js is)
//     const sslKeyPath = path.join(__dirname, 'warehouse-management-API', 'key.pem');
//     const sslCertPath = path.join(__dirname, 'warehouse-management-API', 'cert.pem');
    
//     if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
//         const sslKey = fs.readFileSync(sslKeyPath);
//         const sslCert = fs.readFileSync(sslCertPath);

//         const httpsServer = https.createServer({
//             key: sslKey,
//             cert: sslCert,
//         }, app);

//         httpsServer.listen(PORT, '0.0.0.0', () => {
//             console.log(`HTTPS Server running securely on https://0.0.0.0:${PORT}`);
//         });
//     } else {
//         console.warn('SSL key or cert not found. Starting HTTP server instead.');
//         startHttpServer(); // Fallback to HTTP
//     }
// } catch (error) {
//     console.error('Error reading SSL files or starting HTTPS server:', error);
//     console.warn('Starting HTTP server due to SSL error.');
//     startHttpServer(); // Fallback to HTTP
// }

// function startHttpServer() {
//     app.listen(PORT, () => {
//         console.log(`HTTP Server running on http://localhost:${PORT}`);
//     });
// }
// --- End HTTPS Setup --- 