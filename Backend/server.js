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
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://192.168.1.36:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting - more permissive for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// Specific auth rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50 // 50 auth attempts per 15 minutes
});
app.use('/api/auth', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

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

// Test endpoint to check MongoDB connection
app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is working!',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    database: mongoose.connection.name
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
app.use((req, res) => {
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

// Database connection with fallback to in-memory
const connectDB = async () => {
  try {
    console.log('🔍 Connecting to MongoDB...');
    
    let mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cinecore';
    
    // Connect directly to MongoDB Atlas (no fallback to local)
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      retryWrites: true,
      w: 'majority'
    });
    console.log('✅ Connected to MongoDB Atlas');
    console.log('🗄️ Database:', mongoUri.split('/').pop().split('?')[0]);
    console.log('📱 CineCore API ready!');
  } catch (err) {
    console.log('❌ Database connection failed:', err.message);
    console.log('🔄 Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CineCore Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('�️ Film production platform ready!');
});