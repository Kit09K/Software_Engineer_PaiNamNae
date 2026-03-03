const express = require('express');
const systemLogController = require('../controllers/systemLog.controller');
const { protect, requireAdmin } = require('../middlewares/auth');
const validate = require('../middlewares/validate'); // ถ้ามี middleware ตรวจสอบ query
const systemLogValidation = require('../validations/systemLog.validation'); // ถ้ามีไฟล์ validation

const router = express.Router();

// ทุกเส้นทางในไฟล์นี้ต้องผ่านการยืนยันตัวตน และต้องเป็น Admin เท่านั้น
router.use(protect, requireAdmin);

// logs_export() (export log to JSON และสามารถ Filter ข้อมูลได้)
// GET /api/system-logs/export
router.get('/export', systemLogController.exportLogs);

// static del_morethan90_log() (ลบ log หากเกิน 90 วัน)
// DELETE /api/system-logs/old-logs
router.delete('/old-logs', systemLogController.deleteOldLogs);

// SELECT ข้อมูลเพื่อมาแสดง และ Filter_logs()
// GET /api/system-logs
router.get('/', systemLogController.getLogs); 

// ดึงรายละเอียดเชิงลึกของ Log รายการเดียว
// GET /api/system-logs/:id
router.get('/:id', systemLogController.getLogById);

module.exports = router;
