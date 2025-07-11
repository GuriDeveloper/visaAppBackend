const { signup, login, logout, createAccount, disableAccount, sendAccountDetails, enableAccount, deleteAccount, userStatusCount, totalOfficers, forgotPassword, resetPassword, getAccountDetails, editAccountDetails } = require('../controllers/authController')
const protect = require('../middlewares/auth')

const router = require('express').Router()

router.post('/signup/',signup)
.post('/login/',login)
.post('/signout/',protect,logout)
.post('/createAccount',protect,createAccount)
.put('/deactivate/:id',protect,disableAccount)
.put('/activateUser/:id',protect,enableAccount)
.get('/allusers',protect,sendAccountDetails)
.delete("/delete-user/:id",protect,deleteAccount)
.get("/statusUser",protect,userStatusCount)
.get("/getOfficer",protect,totalOfficers)
.post("/forgetPassword",protect,forgotPassword)
.post("/resetPassword/:token",protect,resetPassword)
.get("/detailUser/:id",protect,getAccountDetails)
.put("/editUser/:id",protect,editAccountDetails)

module.exports = router