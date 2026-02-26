const EmailService = require('../../code/backend/src/services/email.service.js'); 
const ApiError = require('../../code/backend/src/utils/ApiError');
const nodemailer = require('nodemailer');

describe('EmailService', () => {
    let spySendMail;

    beforeEach(() => {
        jest.clearAllMocks();
        // ใช้ spyOn เพื่อไปดักจับฟังก์ชัน sendMail ที่อยู่ใน transporter ของ EmailService
        spySendMail = jest.spyOn(EmailService.transporter, 'sendMail');
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const validMailPayload = {
        to: 'test@example.com',
        subject: 'หัวข้อทดสอบ',
        text: 'เนื้อหาทดสอบ'
    };

    const invalidMailPayload = {
        to: null,
        subject: null,
        text: null
    };

    test('ควรส่งอีเมลสำเร็จเมื่อข้อมูลครบถ้วน', async () => {
        // จำลองว่าส่งสำเร็จ
        spySendMail.mockResolvedValueOnce('sent');

        await expect(EmailService.sendEmail(validMailPayload)).resolves.not.toThrow();
        
        expect(spySendMail).toHaveBeenCalledTimes(1);
    });

    test('ควรโยน ApiError 400 ถ้าข้อมูลไม่ครบถ้วน', async () => {
        try {
            await EmailService.sendEmail(invalidMailPayload);
        } catch (error) {
            expect(error).toBeInstanceOf(ApiError);
            expect(error.statusCode).toBe(400);
            expect(error.message).toBe("กรุณาระบุผู้รับ หัวข้อ และเนื้อหาอีเมลให้ครบถ้วน");
        }
    });

    test('ควรโยน ApiError 500 ถ้า nodemailer ทำงานผิดพลาด', async () => {
        // จำลองว่าส่งไม่สำเร็จ
        spySendMail.mockRejectedValueOnce(new Error('SMTP Error'));

        try {
            await EmailService.sendEmail(validMailPayload);
        } catch (error) {
            expect(error).toBeInstanceOf(ApiError);
            expect(error.statusCode).toBe(500);
            expect(error.message).toBe("ไม่สามารถส่งอีเมลได้ในขณะนี้ ระบบอาจมีปัญหาขัดข้อง");
        }
    });
});