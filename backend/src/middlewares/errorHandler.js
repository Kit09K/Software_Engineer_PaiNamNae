const { Prisma } = require('@prisma/client');
const ApiError = require('../utils/ApiError');
const systemLogService = require('../services/systemLog.service');

const errorHandler = async(err, req, res, next) => { // เปลี่ยนเป็น async เพื่อใช้ await
    if (process.env.NODE_ENV !== 'production') {
        console.error('💥 AN ERROR OCCURRED 💥:', err);
    }

    // เริ่มต้นจากค่า default
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    //Prisma Validation Error (เช่น missing argument, type mismatch)
    if (err instanceof Prisma.PrismaClientValidationError) {
        statusCode = 400;
        message = 'ข้อมูลส่งมาไม่ครบหรือไม่ถูกต้อง';
    }
    //Prisma Known Request Error (P2002, P2025 ฯลฯ)
    else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002':
                statusCode = 409;
                message = `ข้อมูล "${err.meta.target[0]}" ซ้ำกับที่มีอยู่แล้ว`;
                break;
            case 'P2025':
                statusCode = 404;
                message = 'ไม่พบข้อมูลที่ต้องการ';
                break;
            default:
                statusCode = 500;
                message = 'เกิดข้อผิดพลาดด้านฐานข้อมูล';
        }
    }
    //Zod Validation Error
    else if (err.name === 'ZodError') {
        statusCode = 400;
        message = err.errors.map(e => e.message).join(', ');
    }
    //ApiError ที่โยนเอง
    else if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
    }

    // บันทึกเฉพาะ Error ที่มีนัยสำคัญ 
    if (statusCode >= 500 || statusCode === 409) {
        try {
            await systemLogService.createLog({
                userId: req.user ? req.user.sub : null, // บันทึก ID ผู้ใช้ (ถ้ามี)
                action: 'UPDATE_DATA', // หรือเพิ่ม enum 'SYSTEM_ERROR' ใน schema
                ipAddress: req.ip || req.connection.remoteAddress, // เก็บ IP ตาม พ.ร.บ. คอมฯ
                userAgent: req.get('User-Agent'),
                details: { 
                    statusCode, 
                    errorMessage: err.message, 
                    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
                    path: req.originalUrl,
                    method: req.method
                }
            });
        } catch (logError) {
            console.error('Failed to save system log:', logError);
        }
    }

    //สำหรับ Error 500 ทุกกรณี ให้ใช้ข้อความง่ายๆ เสมอ
    if (statusCode >= 500) {
        message = 'เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่ภายหลัง';
    }

    if (!res.headersSent) {
        res.set('Content-Type', 'application/json; charset=utf-8');
    }

    res.status(statusCode).json({
        success: false,
        message,
        data: null,
    });
};

module.exports = { errorHandler };