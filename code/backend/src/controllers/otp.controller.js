const asyncHandler = require("express-async-handler");


class OtpController {
    constructor(otpService) {
        this.otpService = otpService;
    }

    sendOtpEmail = asyncHandler(async (req, res) => {
        const email = req.user.email;
        this.otpService.createOtp(email);
        return res.status(200).json({
            success: true,
            message: "OTP has been sent to your email if it exists in our system."
        });
    });

    verifyOtp = asyncHandler(async (req, res) => {
        const email = req.user.email;
        const { otpCode } = req.body;

        const result = await this.otpService.verifyOtp(email, otpCode);

        if (!result) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP code."
            });
        }
        return res.status(200).json({
            success: true,
            message: "OTP verified successfully."
        });
    });
}