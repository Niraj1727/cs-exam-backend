const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    console.log('Registering user:', { name, email }); // Log incoming registration request

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email); // Log if user already exists
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      trialStartTime: new Date(), // Set trialStartTime during registration
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    console.log('User registered successfully:', newUser.email); // Log successful registration

    res.json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        trialStartTime: newUser.trialStartTime, // Include trialStartTime in the response
      },
    });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).send('Server error');
  }
});

// Login a user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Login attempt for:', email); // Log login attempt

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email); // Log if user not found
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Incorrect password for:', email); // Log incorrect password
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Set trialStartTime if not already set
    if (!user.trialStartTime) {
      user.trialStartTime = new Date();
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    console.log(`User logged in successfully: ${user.email}`); // Log successful login

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        trialStartTime: user.trialStartTime, // Include trialStartTime in the response
      },
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
