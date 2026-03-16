const systemLogService = require('../services/systemLog.service');

/**
 * Middleware สำหรับดักจับและบันทึกกิจกรรมสำคัญ (Critical Actions)
 * @param {string} actionType       - ค่าต้องตรงกับ Enum LogAction (เช่น CREATE_DATA, UPDATE_DATA, DELETE_DATA)
 * @param {string} targetTable      - ชื่อ Table หรือ Module ที่เกิดการกระทำ
 * @param {string} level            - (Optional) ระดับความรุนแรง INFO, WARNING, ERROR, CRITICAL
 */

const logActivity = (actionType, targetTable, level = 'INFO') => {
    return async (req, res, next) => {
        res.on('finish', async () => {
            // เก็บข้อมูลเบื้องต้นจาก Request
            const userId = req.user ? req.user.sub : null;
            const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            const userAgent = req.get('User-Agent');
            const method = req.method;
            const url = req.originalUrl;

            // ดึง API Path (full URL พร้อม query string) สำหรับเก็บเป็น column แยก
            const apiPath = req.originalUrl;
            // Route pattern ที่ Express จับคู่ได้ เช่น /admin/:id (เก็บไว้ใน details)
            const routePattern = req.route?.path || null;

            // ดึง Protocol
            const protocol = `${req.protocol.toUpperCase()}/${req.httpVersion}`;

            // ประเมินว่าสำเร็จหรือล้มเหลวจาก HTTP Status Code
            const isSuccess = res.statusCode >= 200 && res.statusCode < 400;
            const status = isSuccess ? 'SUCCESS' : 'FAILED';

            // Mapping Action กรณีที่ไม่ได้ระบุเจาะจง
            let finalAction = actionType;
            if (!finalAction) {
                if (method === 'GET') finalAction = 'VIEW_DATA';
                else if (method === 'POST') finalAction = 'CREATE_DATA';
                else if (method === 'PUT' || method === 'PATCH') finalAction = 'UPDATE_DATA';
                else if (method === 'DELETE') finalAction = 'DELETE_DATA';
            }

            try {
                await systemLogService.createLog({
                    userId,
                    action: finalAction,
                    apiPath,         // เพิ่ม API Path เป็น field แยก
                    level: isSuccess ? level : (res.statusCode >= 500 ? 'CRITICAL' : 'ERROR'),
                    status,          // เพิ่ม Status เข้าไป
                    protocol,        // เพิ่ม Protocol เข้าไป
                    resource: targetTable || url.split('/')[2] || 'System',
                    targetTable,
                    targetId: req.params.id || (req.body && req.body.id) || null,
                    ipAddress,
                    userAgent,
                    details: {
                        path: url,
                        routePattern,            // เช่น /admin/:id – ช่วยระบุ route pattern
                        method: method,
                        statusCode: res.statusCode,
                        payload: isSuccess && method !== 'GET' ? filterSensitiveData(req.body) : undefined,
                    }
                });
            } catch (error) {
                console.error('Logging Middleware Error:', error);
            }
        });

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