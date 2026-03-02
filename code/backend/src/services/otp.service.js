const { create } = require('domain');
const prisma = require('../utils/prisma');
const crypto = require('crypto');

class OtpService {
    constructor(emailService) {
        this.emailService = emailService;
    }

    // ดึง OTP ที่ยังไม่หมดอายุสำหรับอีเมลที่กำหนด
    async getOtpNotExpireByEmail(email) {
        const otpRecord = await prisma.otp.findFirst({
            where: {
                email: email,
                expireAt: {
                    gt: new Date()
                }
            },
        });
        if (!otpRecord) {
            return null;
        }
        return otpRecord;
    }

    // ลบ OTP 
    async deleteOtpById(otpId) {
        await prisma.otp.deleteMany({
            where: {
                id: otpId
            }
        });
    }

    // ลบ OTP ทั้งหมดที่หมดอายุ
    async deleteExpiredOtps(){
        await prisma.otp.deleteMany({
            where: {
                expireAt: {
                    lt: new Date()
                }
            }
        });
    }

    async sendOtpEmail(email, otpCode) {
        this.emailService.sendEmail({
            to: email,
            subject: "รหัส OTP สำหรับการยืนยันตัวตน painamnae",
            text: `รหัส OTP ของคุณคือ: ${otpCode} (ใช้ได้ภายใน 5 นาที)`,
            attachments: []
        });
    }

    // สร้าง OTP ใหม่สำหรับอีเมลที่กำหนด 
    async createOtp(email,timeToLiveMinutes = 5) {

        // ตรวจสอบว่ามี OTP ที่ยังไม่หมดอายุสำหรับอีเมลนี้หรือไม่
        const otpRecord = await this.getOtpNotExpireByEmail(email);
        if (otpRecord) {
            // หากมี OTP ที่ยังไม่หมดอายุ ให้ลบออกก่อนที่จะสร้างใหม่
            await this.deleteOtpById(otpRecord.id);
        }

        const otpCode = crypto.randomInt(100000, 999999).toString(); // สร้าง OTP 6 หลัก
        const createdAt = new Date();
        const expireAt = new Date(Date.now() + timeToLiveMinutes * 60 * 1000); // คำนวณเวลาหมดอายุ

        // บันทึก OTP ลงในฐานข้อมูล
        await prisma.otp.create({
            data: {
                email: email,
                otpCode: otpCode,
                createdAt: createdAt,
                expireAt: expireAt
            }
        });

        // ส่งอีเมล OTP ไปยังผู้ใช้
        await this.sendOtpEmail(email, otpCode);
    }

    // ตรวจสอบว่า OTP ที่ให้มาตรงกับที่บันทึกไว้ในฐานข้อมูลและยังไม่หมดอายุหรือไม่
    async verifyOtp(email, code) {
        const otpRecord = await this.getOtpNotExpireByEmail(email);
        if (!otpRecord) {
            throw new Error("OTP ไม่ถูกต้องหรือหมดอายุแล้ว"); // ไม่มี OTP ที่ยังไม่หมดอายุสำหรับอีเมลนี้
        }
        if (otpRecord.otpCode !== code) {
            throw new Error("OTP ไม่ถูกต้อง"); // OTP ไม่ตรงกัน
        }
        // หาก OTP ถูกต้องและยังไม่หมดอายุ ให้ลบ OTP นั้นออกจากฐานข้อมูล
        await this.deleteOtpById(otpRecord.id);
        return true; // OTP ถูกต้อง
    }

}

module.exports = OtpService;