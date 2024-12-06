const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow local development and deployed frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // Allow credentials like cookies
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
}));

// Handle Preflight Requests
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://acezy.site');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200); // Preflight request successful
}); // Enable CORS for all preflight requests
app.use(express.json());


// Debug Logging Middleware
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Import Routes
const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const paymentRoutes = require('./routes/payment'); // Import payment routes

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/payment', paymentRoutes); // Use payment routes

// Default route to test API availability
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
