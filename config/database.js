const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.log("💡 Check your MONGO_URI environment variable in Render");
    process.exit(1);
  }
};

module.exports = connectDB;