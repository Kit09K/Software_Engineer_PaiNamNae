const systemLogService = require('../services/systemLog.service');

/**
 * Middleware สำหรับดักจับและบันทึกกิจกรรมสำคัญ (Critical Actions)
 * @param {string} actionType 
 * @param {string} targetTable 
 */

const logActivity = (actionType, targetTable) => {
    return async (req, res, next) => {
        // เก็บข้อมูลเบื้องต้นจาก Request
        const userId = req.user ? req.user.sub : null;
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        const method = req.method;
        const url = req.originalUrl;

        // ดึง ID ของเป้าหมายจาก Params (ถ้ามี)
        const targetId = req.params.id || req.body.id || null;

        // บันทึกเฉพาะเมื่อเป็น Method ที่มีการเปลี่ยนแปลงข้อมูล หรือตามที่ระบุ actionType มา
        const criticalMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
        
        // รอให้ Controller ทำงานเสร็จก่อนเพื่อดูว่า Success หรือไม่ (Optional)
        // แต่ในทางกฎหมาย การดักจับ "ความพยายาม" (Attempt) ก็มีความสำคัญ
        
        try {
            // บันทึก Log ลงฐานข้อมูล
            await systemLogService.createLog({
                userId,
                action: actionType || `${method}_ACTIVITY`,
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