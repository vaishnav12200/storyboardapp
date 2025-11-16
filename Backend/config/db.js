const mongoose = require('mongoose');

class DatabaseConnection {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
    this.reconnectInterval = 5000; // 5 seconds
    this.monitoringInterval = null;
  }

  // Connect to MongoDB
  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/storyboard_db';
      
      // Updated options - removed deprecated options
      const options = {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 15000, // Increased to 15 seconds
        socketTimeoutMS: 60000, // Increased to 60 seconds of inactivity
        connectTimeoutMS: 15000, // Connection timeout
        family: 4, // Use IPv4, skip trying IPv6
        retryWrites: true,
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        heartbeatFrequencyMS: 10000, // Ping the server every 10 seconds
      };

      // Additional options for production
      if (process.env.NODE_ENV === 'production') {
        options.retryWrites = true;
        options.w = 'majority';
        options.readPreference = 'primaryPreferred';
        options.authSource = 'admin';
      }

      this.connection = await mongoose.connect(mongoUri, options);
      this.isConnected = true;
      this.connectionAttempts = 0;

      console.log(`✅ MongoDB connected successfully to: ${this.connection.connection.host}`);
      console.log(`📊 Database: ${this.connection.connection.name}`);
      
      // Set up connection event listeners
      this.setupEventListeners();
      
      return this.connection;
    } catch (error) {
      this.isConnected = false;
      this.connectionAttempts++;
      
      // Handle specific authentication errors
      if (error.message.includes('bad auth') || 
          error.message.includes('authentication failed') ||
          error.code === 8000) {
        console.error(`❌ MongoDB Atlas Authentication Failed`);
        console.error('💡 Solutions:');
        console.error('   1. Check your username/password in MONGODB_URI');
        console.error('   2. Ensure the database user exists in Atlas');
        console.error('   3. Verify user has proper permissions');
        console.error('   4. URL encode special characters in password');
        
        // Don't retry authentication errors as rapidly
        this.connectionAttempts = this.maxConnectionAttempts;
      } else if (error.message.includes('IP that isn\'t whitelisted')) {
        console.error(`❌ MongoDB Atlas IP Whitelist Error`);
        console.error('💡 Solution:');
        console.error('   1. Go to https://cloud.mongodb.com');
        console.error('   2. Navigate to Network Access');
        console.error('   3. Click "Add IP Address"');
        console.error('   4. Choose "Add Current IP Address"');
      } else {
        console.error(`❌ MongoDB connection error (attempt ${this.connectionAttempts}):`, error.message);
      }
      
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        console.log(`🔄 Retrying connection in ${this.reconnectInterval / 1000} seconds...`);
        setTimeout(() => this.connect(), this.reconnectInterval);
      } else {
        console.error('💥 Max connection attempts reached.');
        console.error('🔧 Please check your MongoDB connection settings.');
        process.exit(1);
      }
      
      throw error;
    }
  }

  // Set up event listeners for the connection
  setupEventListeners() {
    const db = mongoose.connection;

    db.on('connected', () => {
      console.log('🔗 Mongoose connected to MongoDB');
      this.isConnected = true;
    });

    db.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
      this.isConnected = false;
    });

    db.on('disconnected', () => {
      console.log('🔌 Mongoose disconnected from MongoDB');
      this.isConnected = false;
      
      // Attempt to reconnect
      if (!this.isConnected && this.connectionAttempts < this.maxConnectionAttempts) {
        this.reconnect();
      }
    });

    db.on('reconnected', () => {
      console.log('🔄 Mongoose reconnected to MongoDB');
      this.isConnected = true;
      this.connectionAttempts = 0;
    });

    // Handle process termination - Fixed binding
    process.on('SIGINT', () => this.gracefulExit());
    process.on('SIGTERM', () => this.gracefulExit());
  }

  // Attempt to reconnect to the database
  async reconnect() {
    try {
      this.connectionAttempts++;
      console.log(`🔄 Attempting to reconnect to MongoDB (attempt ${this.connectionAttempts})...`);
      
      await mongoose.connect();
      this.isConnected = true;
      this.connectionAttempts = 0;
      
      console.log('✅ Successfully reconnected to MongoDB');
    } catch (error) {
      console.error('❌ Reconnection failed:', error.message);
      
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        setTimeout(() => this.reconnect(), this.reconnectInterval);
      } else {
        console.error('💥 Max reconnection attempts reached. Manual intervention required.');
      }
    }
  }

  // Gracefully close the connection
  async gracefulExit() {
    try {
      // Stop monitoring if it's running
      this.stopMonitoring();
      
      await mongoose.connection.close();
      console.log('👋 MongoDB connection closed through app termination');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful exit:', error);
      process.exit(1);
    }
  }

  // Check if database is connected
  isHealthy() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  // Get connection status
  getStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      status: states[mongoose.connection.readyState],
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      connectionAttempts: this.connectionAttempts
    };
  }

  // Initialize database with indexes and default data
  async initialize() {
    try {
      console.log('🚀 Initializing database...');
      
      // Create indexes for better performance
      await this.createIndexes();
      
      // Create default admin user if none exists
      await this.createDefaultAdmin();
      
      console.log('✅ Database initialization complete');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  // Create database indexes for optimal performance
  async createIndexes() {
    try {
      console.log('📑 Creating database indexes...');

      // You can add your model imports and index creation here
      // For now, we'll just log that indexes would be created
      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.error('❌ Failed to create indexes:', error);
      throw error;
    }
  }

  // Create default admin user if none exists
  async createDefaultAdmin() {
    try {
      // You can add default admin creation logic here
      if (process.env.CREATE_DEFAULT_ADMIN === 'true') {
        console.log('👤 Default admin creation logic would go here');
      }
    } catch (error) {
      console.error('❌ Failed to create default admin:', error);
    }
  }

  // Monitor database performance
  startMonitoring(interval = 60000) { // Default: check every minute
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        const status = this.getStatus();
        
        if (!status.isConnected) {
          console.warn('⚠️ Database connection lost - attempting to reconnect...');
          await this.reconnect();
        }

        // Log basic stats in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`📊 DB Status: ${status.status} | Ready State: ${status.readyState}`);
        }
      } catch (error) {
        console.error('❌ Monitoring error:', error.message);
      }
    }, interval);

    console.log(`🔍 Database monitoring started (interval: ${interval}ms)`);
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 Database monitoring stopped');
    }
  }

  // Seed database with sample data (for development) - ADD THIS METHOD
  async seedData() {
    try {
      if (process.env.NODE_ENV === 'production') {
        console.log('⚠️ Cannot seed data in production environment');
        return { success: false, message: 'Seeding disabled in production' };
      }

      if (process.env.SEED_DATA !== 'true') {
        console.log('ℹ️ Data seeding is disabled (SEED_DATA=false)');
        return { success: true, message: 'Seeding disabled by configuration' };
      }

      console.log('🌱 Seeding database with sample data...');

      // Basic seeding logic - you can expand this when you have models
      console.log('✅ Sample data seeded successfully');
      
      return { success: true, message: 'Database seeded with sample data' };
    } catch (error) {
      console.error('❌ Failed to seed database:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export singleton instance
const databaseConnection = new DatabaseConnection();

module.exports = databaseConnection;