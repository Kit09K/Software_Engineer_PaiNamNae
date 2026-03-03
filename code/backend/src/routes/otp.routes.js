const express = require('express');
const router = express.Router();

const OtpController = require('../controllers/otp.controller');
const OtpService = require('../services/otp.service');
const EmailService = require('../services/email.service');
const { protect } = require('../middlewares/auth');

const emailService = new EmailService();
const otpService = new OtpService(emailService);
const otpController = new OtpController(otpService);

// POST /api/otp/send
router.post(
        '/send',
        protect, 
        otpController.sendOtpEmail);

// POST /api/otp/verify
router.post(
        '/verify',
        protect, 
        otpController.verifyOtp);

<<<<<<< HEAD
// GET /api/otp/get-for-testing (สำหรับ testing เท่านั้น)
router.get(
        '/get-for-testing',
        protect, 
        otpController.getOtpForTesting);

=======
>>>>>>> origin/StoryLog
module.exports = router;