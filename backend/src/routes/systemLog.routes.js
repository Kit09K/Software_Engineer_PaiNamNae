const express = require('express');
const systemLogController = require('../controllers/systemLog.controller');
const auth = require('../middlewares/auth');
const ensureAdmin = require('../bootstrap/ensureAdmin'); // ตรวจสอบสิทธิ์ Admin
const validate = require('../middlewares/validate'); // ถ้ามี middleware ตรวจสอบ query
const systemLogValidation = require('../validations/systemLog.validation'); // ถ้ามีไฟล์ validation

const router = express.Router();

// ทุกเส้นทางในไฟล์นี้ต้องผ่านการยืนยันตัวตน (auth) และต้องมีสิทธิ์เป็น Admin (ensureAdmin) เท่านั้น
// เพื่อให้สอดคล้องกับข้อกำหนดเรื่องการจำกัดการเข้าถึงข้อมูลส่วนบุคคล (PDPA)
router.use(auth.protect, ensureAdmin);

// ดึงรายการ Logs ทั้งหมด (รองรับ Pagination, Filtering ตามวันที่และ Action)
// validate(systemLogValidation.getLogs)
router.get('/', systemLogController.getLogs); 

// ดึงรายละเอียดเชิงลึกของ Log รายการเดียว (เพื่อดู JSON details)
// validate(systemLogValidation.getLogById),
router.get('/:id', systemLogController.getLogById);

module.exports = router;