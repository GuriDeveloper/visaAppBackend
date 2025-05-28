const express = require('express')
const server = express()
const cookieParser = require('cookie-parser');
require('dotenv').config()
const connectDB = require('./config/db')
const PORT = process.env.PORT || 5500
const authRoutes = require('./routes/authRoute')
const applicationRoutes = require('./routes/applicationRoutes')
// connect to DB
connectDB()

// middlwares
server.use(cookieParser());
server.use(express.json())

// server.get('/',(req,res)=>{
//     res.json({status:200,msg:"OK"})
// })

// Routes
server.use('/api/v1/auth/',authRoutes)
server.use('/api/v1/application/',applicationRoutes)

// Server listen
server.listen(PORT,()=>{
    console.log(`Server is running on port : ${PORT}`)
})