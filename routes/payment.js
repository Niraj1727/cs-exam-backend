const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User'); // Import the User model

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a new payment order
router.post('/create-order', async (req, res) => {
    try {
        const { amount, currency } = req.body;
        console.log('Creating order with amount:', amount, 'and currency:', currency);

        const options = {
            amount: amount * 100, // Convert amount to paise
            currency: currency || 'INR',
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        console.log('Order created successfully:', order);

        res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({ message: 'Error creating order' });
    }
});

// Verify payment and update subscription
router.post('/verify-payment', async (req, res) => {
    console.log('Incoming request body for verification:', req.body);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
        console.error('Missing required fields:', { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId });
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    console.log('Verifying signature with body:', body);

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

    if (expectedSignature === razorpay_signature) {
        console.log('Payment signature verified successfully.');

        try {
            // Calculate subscription expiry date (e.g., 30 days from now)
            const subscriptionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            console.log('Updating subscription expiry date to:', subscriptionExpiry);

            // Update the user's subscription in the database
            const user = await User.findByIdAndUpdate(
                userId,
                {
                    subscriptionActive: true,
                    subscriptionExpiry,
                },
                { new: true } // Return the updated document
            );

            if (!user) {
                console.error('User not found with ID:', userId);
                return res.status(404).json({ message: 'User not found' });
            }

            console.log('User subscription updated successfully:', user);

            res.json({
                message: 'Payment verified successfully',
                subscriptionActive: user.subscriptionActive,
                subscriptionExpiry: user.subscriptionExpiry,
            });
        } catch (err) {
            console.error('Error updating subscription:', err);
            res.status(500).json({ message: 'Error updating subscription' });
        }
    } else {
        console.error('Invalid payment signature. Expected:', expectedSignature, 'Received:', razorpay_signature);
        res.status(400).json({ message: 'Invalid payment signature' });
    }
});

module.exports = router;
