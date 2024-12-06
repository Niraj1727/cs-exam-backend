const mongoose = require('mongoose');

// Define the User schema
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    trialStartTime: { type: Date }, // Trial start time
    isAdmin: { type: Boolean, default: false }, // Admin flag
    subscriptionActive: { type: Boolean, default: false }, // Subscription status
    subscriptionExpiry: { type: Date, default: null }, // Subscription expiry date
});

// Export the User model
module.exports = mongoose.model('User', UserSchema);
