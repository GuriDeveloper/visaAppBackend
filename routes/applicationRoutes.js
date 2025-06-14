const { submitApp, applications, userDetail, approveApplication, excelApplication, applicationStatusStats, monthlyApplications2025, deactivateAndReject } = require('../controllers/applicationController')
const protect = require('../middlewares/auth')
const upload = require('../middlewares/uploadMiddleware')

const router = require('express').Router()

router.post('/submit',protect,upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'aadhar', maxCount: 1 },
    { name: 'passport', maxCount: 1 }
  ]),submitApp)
  .get('/allUsers',protect,applications)
  .get('/user/:id',protect,userDetail)
  .patch("/status/:id",protect,approveApplication)
  .get("/applicationDetail",protect,excelApplication)
  .get("/totalApplicationStatus",protect,applicationStatusStats)
  .get("/monthWiseAPI",protect,monthlyApplications2025)
  .put("/accountDeactiveRejected/:id",protect,deactivateAndReject)

  

module.exports = router