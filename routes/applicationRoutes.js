const { submitApp, applications } = require('../controllers/applicationController')
const protect = require('../middlewares/auth')
const upload = require('../middlewares/uploadMiddleware')

const router = require('express').Router()

router.post('/submit',protect,upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'aadhar', maxCount: 1 },
    { name: 'passport', maxCount: 1 }
  ]),submitApp)
  .get('/allUsers',protect,applications)
  

module.exports = router