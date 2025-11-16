const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Testing MongoDB Atlas connection...');
console.log(`📍 Your IP Address: 117.215.27.86`);
console.log(`🔗 MongoDB URI: ${process.env.MONGODB_URI ? 'Found' : 'Missing'}`);

async function testConnection() {
  try {
    console.log('\n⏳ Attempting to connect to MongoDB Atlas...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout for testing
    });
    
    console.log('✅ SUCCESS: Connected to MongoDB Atlas!');
    console.log('🎉 Your database is ready to use.');
    
    // Test a simple operation
    const adminDb = mongoose.connection.db.admin();
    const result = await adminDb.ping();
    console.log('📊 Database ping successful:', result);
    
    process.exit(0);
  } catch (error) {
    console.log('\n❌ Connection failed:');
    console.log(`Error: ${error.message}`);
    
    if (error.message.includes('IP')) {
      console.log('\n🔧 Next steps:');
      console.log('1. Go to https://cloud.mongodb.com/');
      console.log('2. Navigate to Network Access');
      console.log('3. Add IP address: 117.215.27.86');
      console.log('4. Wait 1-2 minutes and try again');
    }
    
    process.exit(1);
  }
}

testConnection();