const pool = require('../config/db'); // Use the configured pool
const jwt = require('jsonwebtoken');
const { sha256 } = require('../utils/hash'); // Import the utility

// Assuming secretKey comes from environment variables or a config file
const secretKey = process.env.JWT_SECRET; 

// Login Controller
const login = (req, res) => {
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

        pool.query(
            `SELECT userId, username, password, workPlace, fullName
             FROM xicorana.user
             WHERE username = ?`, // Query only by username first
            [username],
            (err, results) => {
                if (err) {
                    console.error('Database error during login:', err);
                    return res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(err)}` });
                }

                if (results.length === 0) {
                    return res.status(401).json({ success: false, error: `نام کاربری یا رمز عبور اشتباه است` });
                }

                const user = results[0];

                // Compare the hashed provided password with the stored hash
                if (user.password !== hashedPassword) {
                    console.warn(`Password mismatch for user: ${username}`);
                    return res.status(401).json({ success: false, error: `نام کاربری یا رمز عبور اشتباه است` });
                }

                // Passwords match, generate JWT
                const tokenPayload = { 
                    userId: user.userId,
                    username: user.username,
                    workPlace: user.workPlace 
                    // Add other relevant, non-sensitive user details if needed
                };
                
                // Sign the token
                const token = jwt.sign(tokenPayload, secretKey, { expiresIn: '1h' }); // Add an expiration!

                // Send response
                res.json({
                    success: true, // Indicate success explicitly
                    token,
                    workPlace: user.workPlace,
                    userId: user.userId,
                    fullName: user.fullName
                });
            }
        );
    } catch (error) {
        console.error('Error during login process:', error);
        res.status(500).json({ success: false, error: 'خطای داخلی سرور' });
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