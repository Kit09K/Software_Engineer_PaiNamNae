const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');
const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        // สร้าง transporter สำหรับส่งอีเมล โดยใช้ Gmail เป็นบริการส่งอีเมล
        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    // ฟังก์ชันหลักสำหรับส่งอีเมล
    async sendEmail({ to, subject, text, attachments }) {
        // 1. Validation เบื้องต้น
        if (!to || !subject || !text) {
            // โยน Status 400 (Bad Request) ถ้าส่งข้อมูลมาไม่ครบ
            throw new ApiError(400, "กรุณาระบุผู้รับ หัวข้อ และเนื้อหาอีเมลให้ครบถ้วน");
        }

        try {
            const mailOptions = {
                from: `"painamnae Team" <${process.env.EMAIL_USER}>`,
                to: to, 
                subject: subject, 
                text: text,
                attachments: attachments
            };
            
            await this.transporter.sendMail(mailOptions);
            
        } catch (error) {
            // 2. Log Error เชิงลึกเก็บไว้ดูเองหลังบ้าน (มีประโยชน์มากเวลา SMTP พัง)
            console.error("[EmailService] Error sending email to:", to);
            console.error("[EmailService] Error Details:", error.message);
            
            // 3. โยน ApiError ออกไปหา Controller (และต่อไปยัง Global Error Handler)
            // ใช้ Status 500 เพราะถือเป็นความผิดพลาดของฝั่ง Server เราเองที่ส่งไม่ผ่าน
            throw new ApiError(500, "ไม่สามารถส่งอีเมลได้ในขณะนี้ ระบบอาจมีปัญหาขัดข้อง");
        }
    }
}

module.exports = EmailService;