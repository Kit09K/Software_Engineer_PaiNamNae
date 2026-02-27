const systemLogService = require('../services/systemLog.service');

/**
 * Middleware สำหรับดักจับและบันทึกกิจกรรมสำคัญ (Critical Actions)
 * @param {string} actionType       - ค่าต้องตรงกับ Enum LogAction (เช่น CREATE_DATA, UPDATE_DATA, DELETE_DATA)
 * @param {string} targetTable      - ชื่อ Table หรือ Module ที่เกิดการกระทำ
 * @param {string} level            - (Optional) ระดับความรุนแรง INFO, WARNING, ERROR, CRITICAL
 */

const logActivity = (actionType, targetTable, level = 'INFO') => {
    return async (req, res, next) => {
        // เก็บข้อมูลเบื้องต้นจาก Request
        const userId = req.user ? req.user.sub : null;
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        const method = req.method;
        const url = req.originalUrl;

        // ดึง ID ของเป้าหมายจาก Params (ถ้ามี)
        const targetId = req.params.id || req.body.id || null;

        // ป้องกันปัญหา Enum ผิดพลาด โดยผูก HTTP Method เข้ากับ LogAction พื้นฐาน
        let defaultAction = 'UPDATE_DATA';
        if (method === 'POST') defaultAction = 'CREATE_DATA';
        if (method === 'DELETE') defaultAction = 'DELETE_DATA';
        
        try {
            // บันทึก Log ลงฐานข้อมูล
            await systemLogService.createLog({
                userId,
                action: actionType || defaultAction,
                level: method === 'DELETE' ? 'WARNING' : level, // ถ้ายกเลิก/ลบ ให้แจ้งเตือนเป็น WARNING เสมอ
                resource: targetTable, // Filter_logs
                targetTable,
                targetId,
                ipAddress,
                userAgent,
                details: {
                    path: url,
                    method: method,
                    // ไม่ควรบันทึก Sensitive Data เช่น Password ลงใน Details
                    // กรองเฉพาะฟิลด์ที่สำคัญเพื่อการ Audit
                    payload: filterSensitiveData(req.body),
                    params: req.params,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            // ป้องกันไม่ให้การบันทึก Log ที่ผิดพลาดไปหยุดการทำงานหลักของระบบ
            console.error('Logging Middleware Error:', error);
        }

        next();
    };
};

// ฟังก์ชันช่วยกรองข้อมูลอ่อนไหวออกก่อนบันทึก Log
const filterSensitiveData = (data) => {
    if (!data) return {};
    const sensitiveFields = ['password', 'token', 'otp', 'creditCard'];
    const filtered = { ...data };
    
    sensitiveFields.forEach(field => {
        if (filtered[field]) filtered[field] = '********';
    });
    
    return filtered;
};

module.exports = { logActivity };