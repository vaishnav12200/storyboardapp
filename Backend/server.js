const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Clean server without admin system

// Import routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const storyboardRoutes = require('./routes/storyboardRoutes');
const scriptRoutes = require('./routes/scriptRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const shotlistRoutes = require('./routes/shotlistRoutes');
const locationRoutes = require('./routes/locationRoutes');
const exportRoutes = require('./routes/exportRoutes');

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Database connection will be handled later with admin initialization

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/storyboard', storyboardRoutes);
app.use('/api/script', scriptRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/shotlist', shotlistRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/export', exportRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

// Database connection with retry logic
const connectDB = async () => {
  try {
    console.log('🔍 Environment check:');
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    console.log('MONGODB_URI length:', process.env.MONGODB_URI?.length || 0);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB Atlas');
    console.log('📱 CineCore API ready for film production features');
  } catch (err) {
    console.log('⚠️ MongoDB Atlas connection failed');
    console.log('Error:', err.message);
    console.log('📝 Please check:');
    console.log('  1. Cluster is resumed at https://cloud.mongodb.com/');
    console.log('  2. Your IP address is whitelisted in Network Access');
    console.log('  3. Credentials are correct in .env file');
    console.log('\n🔄 Retrying connection in 10 seconds...');
    setTimeout(connectDB, 10000); // Retry after 10 seconds
  }
};

connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CineCore Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('�️ Film production platform ready!');
});