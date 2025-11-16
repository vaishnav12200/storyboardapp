const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Keep-alive ping successful:', new Date().toISOString());
    
    // Simple query to keep connection active
    await mongoose.connection.db.admin().ping();
    
    // Disconnect after ping
    await mongoose.connection.close();
    console.log('📝 Connection closed');
    
  } catch (error) {
    console.log('❌ Keep-alive failed:', error.message);
  }
};

// Run keep-alive ping
connectDB();