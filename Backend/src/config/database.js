import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * Connects to MongoDB Atlas using the URI specified in environment variables.
 * Includes timeout settings and helpful error messages for IP whitelist issues.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
    });
    logger.info(`MongoDB Connected Successfully: ${conn.connection.host}`);
    await logger.audit('DB_CONNECTION', `MongoDB connected to host: ${conn.connection.host}`);
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    console.error('');
    console.error('=====================================================');
    console.error(' MONGODB CONNECTION FAILED');
    console.error('=====================================================');
    console.error(' Most likely cause: Your IP is not whitelisted.');
    console.error(' Your current IP: run  wget -qO- https://api.ipify.org');
    console.error(' Fix: Go to https://cloud.mongodb.com');
    console.error('   → Security → Network Access → Add IP Address');
    console.error('   → Add your IP OR use 0.0.0.0/0 for all IPs (dev only)');
    console.error('=====================================================');
    process.exit(1);
  }
};

export default connectDB;
