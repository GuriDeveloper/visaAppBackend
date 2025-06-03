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

// Connect to DB
connectDB();

// 🔹 CORS Middleware
server.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL
  credentials: true // Allow cookies to be sent
}));

// Middleware
server.use(cookieParser());
server.use(express.json());

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
