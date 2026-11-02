import mongoose from "mongoose";

// Disable command buffering globally so queries never freeze for 10 seconds if disconnected
mongoose.set("bufferCommands", false);

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI is not defined. Server running with Supabase primary store.");
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.warn("Server is running without MongoDB connection. Supabase & fallback storage active.");
  }
};

export default connectDB;
