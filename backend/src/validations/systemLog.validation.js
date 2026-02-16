const Joi = require('joi');

// Validation schema สำหรับการดึงรายการ Logs
// ตรวจสอบความถูกต้องของพารามิเตอร์ที่ใช้ในการ Audit ตามกฎหมาย
const getLogs = {
  query: Joi.object().keys({
    // กรองตามประเภทกิจกรรมที่ออกแบบไว้ใน Enum
    action: Joi.string().valid(
      'LOGIN', 
      'LOGOUT', 
      'ACCESS_SENSITIVE_DATA', 
      'CREATE_DATA', 
      'UPDATE_DATA', 
      'DELETE_DATA', 
      'APPROVE_VERIFICATION', 
      'REJECT_VERIFICATION', 
      'SOS_TRIGGERED'
    ),

    // ตรวจสอบ UserId กรณีต้องการดูประวัติรายบุคคล
    userId: Joi.string().custom((value, helpers) => {
      if (!value.match(/^[a-z0-9]+$/i)) { // ตรวจสอบรูปแบบ cuid/uuid เบื้องต้น
        return helpers.message('"userId" format is invalid');
      }
      return value;
    }),

    // กรองตามช่วงวันที่ (ISO Date format: YYYY-MM-DD)
    startDate: Joi.date().iso().messages({
      'date.format': 'StartDate ต้องอยู่ในรูปแบบ YYYY-MM-DD'
    }),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).messages({
      'date.min': 'EndDate ต้องไม่น้อยกว่า StartDate'
    }),

    // พารามิเตอร์สำหรับการทำ Pagination
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
  }),
};

// Validation schema สำหรับการดูรายละเอียด Log รายรายการ
const getLogById = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

module.exports = {
  getLogs,
  getLogById,
};