const express = require('express');
const logIntegrityController = require('../controllers/logIntegrity.controller');
const { protect, requireAdmin } = require('../middlewares/auth');

const router = express.Router();

// ทุกเส้นทางต้องผ่านการยืนยันตัวตน และต้องเป็น Admin
router.use(protect, requireAdmin);

// ตรวจสอบ integrity ของทุก anchor block
// GET /api/logs/verify-anchors
router.get('/verify-anchors', logIntegrityController.verifyAnchors);

// ตรวจสอบ hash chain ของ block ที่ระบุ
// GET /api/logs/verify-block?start=1&end=100
router.get('/verify-block', logIntegrityController.verifyBlock);

module.exports = router;
