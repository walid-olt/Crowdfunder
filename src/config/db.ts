import env from './env.js';
import mongoose from 'mongoose';
export const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI, {dbName: env.MONGODB_DB_NAME});
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); 
  }
};
