const nodemailer = require('nodemailer');

jest.mock('nodemailer', () => ({
    createTransport: jest.fn(),
}));

describe('EmailService', () => {
    let sendMailMock;
    let EmailService;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        // mock sendMail function
        sendMailMock = jest.fn().mockResolvedValue(true);

        // mock transporter
        nodemailer.createTransport.mockReturnValue({
            sendMail: sendMailMock,
        });

        EmailService = require('../../backend/src/services/email.service.js');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should send email with correct data', async () => {
        await EmailService.sendEmail({
            to: 'test@example.com',
            subject: 'Test Subject',
            text: 'Hello world',
            attachments: [],
        });

        expect(sendMailMock).toHaveBeenCalledWith({
            from: expect.stringContaining('painamnae Team'),
            to: 'test@example.com',
            subject: 'Test Subject',
            text: 'Hello world',
            attachments: [],
        });
    });

    it('should throw error if sendMail fails', async () => {
        sendMailMock.mockRejectedValue(new Error("SNMP Error"));

        await expect(
            EmailService.sendEmail({
                to: 'test@test.com',
                subject: 'Fail',
                text: 'Test',
                attachments: [],
            })
        ).rejects.toThrow('Failed to send email');
     });
});