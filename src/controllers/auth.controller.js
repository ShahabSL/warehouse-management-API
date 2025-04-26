const pool = require('../config/db'); // Use the configured pool
const jwt = require('jsonwebtoken');
const { sha256 } = require('../utils/hash'); // Import the utility

// Assuming secretKey comes from environment variables or a config file
const secretKey = process.env.JWT_SECRET; 

// Login Controller
const login = async (req, res) => {
    console.log('Request body:', req.body);
    console.log('Login endpoint hit');

    let { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'نام کاربری و رمز عبور الزامی است' });
    }

    try {
        // Hash the provided password before comparing
        const hashedPassword = sha256(password);
        console.log('Provided password hashed to:', hashedPassword);

        if (!secretKey) {
             console.error('JWT_SECRET is not defined in environment variables.');
             return res.status(500).json({ success: false, error: 'خطای سرور: تنظیمات امنیتی ناقص است' });
        }
        
        console.log('JWT Secret Check:', process.env.JWT_SECRET ? 'Loaded' : 'MISSING!');

        // Use await for the promise returned by pool.query
        // The result structure is typically [results, fields]
        const [results, fields] = await pool.query(
            `SELECT userId, username, password, workPlace, fullName
             FROM xicorana.user
             WHERE username = ?`,
            [username]
        );
        console.log('Inside pool.query (async)'); // Updated log
        console.log('DB query successful, results count:', results.length);

        if (results.length === 0) {
            console.log('User not found, sending 401');
            return res.status(401).json({ success: false, error: `نام کاربری یا رمز عبور اشتباه است` });
        }

        const user = results[0];
        console.log('User found:', user.username);

        // Compare the hashed provided password with the stored hash
        if (user.password !== hashedPassword) {
            console.warn(`Password mismatch for user: ${username}, sending 401`);
            return res.status(401).json({ success: false, error: `نام کاربری یا رمز عبور اشتباه است` });
        }
        
        console.log('Password matches, proceeding to JWT signing');
        // Passwords match, generate JWT
        const tokenPayload = { 
            userId: user.userId,
            username: user.username,
            workPlace: user.workPlace 
            // Add other relevant, non-sensitive user details if needed
        };
        
        try {
            // Sign the token
            const token = jwt.sign(tokenPayload, secretKey, { expiresIn: '1h' }); // Add an expiration!
            console.log('JWT signing successful, sending response');

            // Send response
            res.json({
                success: true, // Indicate success explicitly
                token,
                workPlace: user.workPlace,
                userId: user.userId,
                fullName: user.fullName
            });
        } catch (jwtError) {
            console.error('Error during JWT signing:', jwtError);
            res.status(500).json({ success: false, error: 'خطا در ایجاد توکن امنیتی' });
        }

    } catch (error) {
        // This outer catch now handles errors from await pool.query as well
        console.error('Error during login process:', error);
        // Check if it's a database error specifically, otherwise generic server error
        if (error.code && error.sqlMessage) { // Basic check for mysql error properties
             res.status(500).json({ success: false, error: `خطای پایگاه داده: ${error.sqlMessage}` });
        } else {
             res.status(500).json({ success: false, error: 'خطای داخلی سرور' });
        }
    }
};

// Logout Controller (JWT logout is stateless, this is more of a placeholder)
const logout = (req, res) => {
    // For JWT, logout is typically handled client-side by deleting the token.
    // Server-side might involve token blacklisting if needed, but that adds complexity.
    res.json({ success: true, message: 'با موفقیت از حساب کاربری خود خارج شدید (توکن باید در کلاینت پاک شود)' });
};

module.exports = {
    login,
    logout,
}; 