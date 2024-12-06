const User = require('../models/User');

const checkTrial = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id); // req.user.id populated by authMiddleware
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const currentTime = new Date();
        const trialStartTime = new Date(user.trialStartTime);
        const trialDuration = 60 * 60 * 1000; // 1 hour in milliseconds

        if (currentTime - trialStartTime > trialDuration) {
            return res.status(403).json({ message: 'Trial expired. Please subscribe to continue.' });
        }

        next();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

module.exports = checkTrial;
