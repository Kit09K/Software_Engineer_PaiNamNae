jest.mock('../../code/backend/src/utils/prisma', () => ({
    otp: {
        findFirst: jest.fn(),
        deleteMany: jest.fn(),
        create: jest.fn()
    }
}));

jest.mock('crypto', () => ({
    randomInt: jest.fn()
}));

const prisma = require('../../code/backend/src/utils/prisma');
const crypto = require('crypto');
const OtpService = require('../../code/backend/src/services/otp.service.js');

describe('OtpService', () => {

    let otpService;
    let mockEmailService;

    beforeEach(() => {
        mockEmailService = {
            sendEmail: jest.fn()
        };

        otpService = new OtpService(mockEmailService);

        jest.clearAllMocks();
    });

    // ===============================
    // getOtpNotExpireByEmail
    // ===============================
    it('should return otp if found', async () => {
        const mockOtp = { id: 1, email: 'test@mail.com' };
        prisma.otp.findFirst.mockResolvedValue(mockOtp);

        const result = await otpService.getOtpNotExpireByEmail('test@mail.com');

        expect(result).toEqual(mockOtp);
    });

    it('should return null if no otp found', async () => {
        prisma.otp.findFirst.mockResolvedValue(null);

        const result = await otpService.getOtpNotExpireByEmail('test@mail.com');

        expect(result).toBeNull();
    });

    // ===============================
    // deleteOtpById
    // ===============================
    it('should delete otp by id', async () => {
        await otpService.deleteOtpById(1);

        expect(prisma.otp.deleteMany).toHaveBeenCalledWith({
            where: { id: 1 }
        });
    });

    // ===============================
    // deleteExpiredOtps
    // ===============================
    it('should delete expired otps', async () => {
        await otpService.deleteExpiredOtps();

        expect(prisma.otp.deleteMany).toHaveBeenCalled();
    });

    // ===============================
    // createOtp
    // ===============================
    it('should create new otp and send email', async () => {

        prisma.otp.findFirst.mockResolvedValue(null);
        prisma.otp.create.mockResolvedValue({});
        crypto.randomInt.mockReturnValue(123456);

        await otpService.createOtp('test@mail.com');

        expect(prisma.otp.create).toHaveBeenCalled();
        expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);
    });

    it('should delete old otp before creating new one', async () => {

        prisma.otp.findFirst.mockResolvedValue({
            id: 99,
            email: 'test@mail.com'
        });

        crypto.randomInt.mockReturnValue(123456);
        prisma.otp.create.mockResolvedValue({});

        await otpService.createOtp('test@mail.com');

        expect(prisma.otp.deleteMany).toHaveBeenCalledWith({
            where: { id: 99 }
        });

        expect(prisma.otp.create).toHaveBeenCalled();
    });

    // ===============================
    // verifyOtp
    // ===============================
    it('should verify otp successfully', async () => {

        prisma.otp.findFirst.mockResolvedValue({
            id: 1,
            email: 'test@mail.com',
            otpCode: '123456'
        });

        const result = await otpService.verifyOtp('test@mail.com', '123456');

        expect(result).toBe(true);
        expect(prisma.otp.deleteMany).toHaveBeenCalledWith({
            where: { id: 1 }
        });
    });

    it('should throw error if otp expired or not found', async () => {

        prisma.otp.findFirst.mockResolvedValue(null);

        await expect(
            otpService.verifyOtp('test@mail.com', '123456')
        ).rejects.toThrow("OTP ไม่ถูกต้องหรือหมดอายุแล้ว");
    });

    it('should throw error if otp not match', async () => {

        prisma.otp.findFirst.mockResolvedValue({
            id: 1,
            otpCode: '999999'
        });

        await expect(
            otpService.verifyOtp('test@mail.com', '123456')
        ).rejects.toThrow("OTP ไม่ถูกต้อง");
    });

});