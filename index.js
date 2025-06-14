// const express = require('express')
// const server = express()
// const cookieParser = require('cookie-parser');
// require('dotenv').config()
// const connectDB = require('./config/db')
// const PORT = process.env.PORT || 5500
// const authRoutes = require('./routes/authRoute')
// const applicationRoutes = require('./routes/applicationRoutes')
// // connect to DB
// connectDB()

// // middlwares
// server.use(cookieParser());
// server.use(express.json())

// // server.get('/',(req,res)=>{
// //     res.json({status:200,msg:"OK"})
// // })

// // Routes
// server.use('/api/v1/auth/',authRoutes)
// server.use('/api/v1/application/',applicationRoutes)

// // Server listen
// server.listen(PORT,()=>{
//     console.log(`Server is running on port : ${PORT}`)
// })

const express = require('express');
const server = express();
const cookieParser = require('cookie-parser');
const cors = require('cors'); // 🔹 Add this line
require('dotenv').config();
const connectDB = require('./config/db');
const PORT = process.env.PORT || 5500;
const authRoutes = require('./routes/authRoute');
const applicationRoutes = require('./routes/applicationRoutes');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Connect to DB
// connectDB();

// Function to create default admin
const createDefaultAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10); // 🔐 Hash the default password

      const adminUser = new User({
        name: 'Admin',
        email: 'admin@gmail.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      });

      await adminUser.save();
      console.log('✅ Default admin created successfully');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
  } catch (err) {
    console.error('❌ Failed to create admin user:', err.message);
  }
};

// Connect DB and run admin creation
connectDB().then(createDefaultAdmin);





// 🔹 CORS Middleware
server.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL
  credentials: true // Allow cookies to be sent
}));

// Middleware
server.use(cookieParser());
server.use(express.json());
server.use('/uploads', express.static('uploads'));

// Optional test route
// server.get('/', (req, res) => {
//   res.json({ status: 200, msg: "OK" });
// });

// Routes
server.use('/api/v1/auth/', authRoutes);
server.use('/api/v1/application/', applicationRoutes);

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port : ${PORT}`);
});
