const asyncHandler = require("express-async-handler");


class OtpController {
    constructor(otpService) {
        this.otpService = otpService;
    }

    sendOtpEmail = asyncHandler(async (req, res) => {
        const email = req.user.email;
        await this.otpService.createOtp(email);
        return res.status(200).json({
            success: true,
            message: "OTP has been sent to your email if it exists in our system."
        });
    });

    verifyOtp = asyncHandler(async (req, res) => {
        const email = req.user.email;
        const { otpCode } = req.body;

        try {
            await this.otpService.verifyOtp(email, otpCode);

            return res.status(200).json({
                success: true,
                message: "OTP verified successfully."
            });

        } catch (error) {
            // หาก Service ตรวจพบว่า OTP ผิด หรือหมดอายุ จะโยน Error มาเข้าบล็อกนี้
            return res.status(400).json({
                success: false,
                message: error.message // จะแสดงข้อความตามที่ Service ตั้งไว้ เช่น "OTP ไม่ถูกต้อง"
            });
        }
    });
}

module.exports = OtpController;