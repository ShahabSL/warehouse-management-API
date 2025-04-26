const jwt = require('jsonwebtoken');
// Assuming secretKey comes from environment variables or a config file
const secretKey = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
    const token = req.header('Authorization');
    if (!token) {
        // Return directly to avoid further execution
        return res.status(401).json({ success: false, error: 'دسترسی به این بخش محدود شده و شما دسترسی لازمه را ندارید' });
    }
    try {
        // Verify the token (remove Bearer prefix if present)
        const actualToken = token.startsWith('Bearer ') ? token.slice(7) : token;
        const decoded = jwt.verify(actualToken, secretKey);
        req.user = decoded; // Attach decoded user info to the request object
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        console.error('JWT Verification Error:', err.message); // Log the error for debugging
        // Use a more specific status code based on the error if possible
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, error: 'توکن منقضی شده است' });
        }
        if (err.name === 'JsonWebTokenError') {
             return res.status(401).json({ success: false, error: 'توکن نامعتبر است' });
        }
        // General error for other verification issues
        res.status(400).json({ success: false, error: 'توکن لازمه معتبر نیست' });
    }
}

module.exports = authenticateToken; 