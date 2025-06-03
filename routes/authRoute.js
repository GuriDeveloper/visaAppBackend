const { signup, login, logout, createAccount, disableAccount, sendAccountDetails, enableAccount } = require('../controllers/authController')
const protect = require('../middlewares/auth')

const router = require('express').Router()

router.post('/signup/',signup)
.post('/login/',login)
.post('/signout/',protect,logout)
.post('/createAccount',protect,createAccount)
.put('/deactivate/:id',protect,disableAccount)
.put('/activateUser/:id',protect,enableAccount)
.get('/allusers',protect,sendAccountDetails)


module.exports = router