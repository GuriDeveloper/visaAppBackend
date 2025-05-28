// user name : gsbedi90
// pass : 7H6y4JfhJrhjDcdI

// 7H6y4JfhJrhjDcdI
// mongodb cloud 
//  MONGO_URI=mongodb+srv://gsbedi90:7H6y4JfhJrhjDcdI@cluster0.jbcw5oh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    // process.exit(1);
  }
};

module.exports = connectDB;