

//mock nodemailer
jest.mock('nodemailer');

const nodemailer = require('nodemailer');
const EmailService = require('../../code/backend/src/services/email.service.js');
const ApiError = require('../../code/backend/src/utils/ApiError');

describe('EmailService', () => {

    beforeEach(() => {
        process.env.EMAIL_USER = 'test@gmail.com';
        process.env.EMAIL_PASS = 'password';
    });

    it('should send email successfully', async () => {

        
        nodemailer.__mockSendMail.mockResolvedValue(true);

        const emailService = new EmailService();

        await emailService.sendEmail({
            to: 'user@test.com',
            subject: 'Test Subject',
            text: 'Hello world',
            attachments: []
        });

        expect(nodemailer.__mockSendMail).toHaveBeenCalledTimes(1);
    });

    it('should throw 500 if sendMail fails', async () => {

        
        nodemailer.__mockSendMail.mockRejectedValue(new Error('SMTP error'));

        const emailService = new EmailService();

        await expect(
            emailService.sendEmail({
                to: 'user@test.com',
                subject: 'Test',
                text: 'Test content'
            })
        ).rejects.toThrow(ApiError);
    });

});