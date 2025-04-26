const pool = require('../config/db');

// Get User List (ID, Full Name, Username)
const getUserList = async (req, res) => {
    console.log('Request received for /users list');

    try {
        const query = `
            SELECT userId, fullName, username 
            FROM xicorana.user;
        `;
        const [results] = await pool.query(query);

        if (results.length === 0) {
            // It's okay if there are no users, return empty array
            return res.status(200).json({ success: true, data: [], message: 'کاربری یافت نشد' });
        }
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error('Database error fetching user list:', error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

module.exports = {
    getUserList,
}; 