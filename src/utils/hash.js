const crypto = require('crypto');

function sha256(password) {
    if (typeof password !== 'string') {
        // Handle non-string input if necessary, e.g., throw an error or return null
        console.error('sha256 function received non-string input:', password);
        return null; // Or throw new Error('Password must be a string.');
    }
    return crypto.createHash('sha256').update(password).digest('hex');
}

module.exports = { sha256 }; 