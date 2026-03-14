const express = require('express');
const router = express.Router();

const PushNotificationController = require('../controllers/pushNotification.controller');
const PushNotificationService = require('../services/pushNotification.service');
const { protect } = require('../middlewares/auth');

// สร้าง instance ของ Service และ Controller
const pushNotificationService = new PushNotificationService();
const pushNotificationController = new PushNotificationController(pushNotificationService);

// รับข้อมูล Subscription จากหน้าเว็บ
router.post('/subscribe',protect, pushNotificationController.subscribe);

// [เพิ่มใหม่] ยิง Push Notification (เหมาะสำหรับ Admin หรือใช้ทดสอบ)
router.post('/send', protect, pushNotificationController.sendPush);

module.exports = router;