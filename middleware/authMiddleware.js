const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model for role checks

const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; // Extract Bearer token
    if (!token) {
        return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id); // Fetch user from the database

        if (!user) {
            return res.status(404).json({ message: 'User not found, authorization denied' });
        }

        req.user = user; // Attach full user data to req.user
        next();
    } catch (err) {
        console.error(err);
        res.status(401).json({ message: 'Invalid token, authorization denied' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (!req.user.isAdmin) { // Check the isAdmin field on the user object
        return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    next();
};

module.exports = { authMiddleware, adminMiddleware };
