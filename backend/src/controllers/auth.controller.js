const asyncHandler = require('express-async-handler');
const { signToken } = require("../utils/jwt");
const userService = require("../services/user.service");
const systemLogService = require("../services/systemLog.service");
const ApiError = require('../utils/ApiError');

const login = asyncHandler(async (req, res) => {

    let user;
    if (email) {
        user = await userService.getUserByEmail(email);
    } else if (username) {
        user = await userService.getUserByUsername(username);
    }

    // กรณี บัญชีถูกระงับ
    if (user && !user.isActive) {
        // บันทึก Log เมื่อพยายามเข้าใช้บัญชีที่ถูกระงับ
        await systemLogService.createLog({
            userId: user.id,
            action: 'LOGIN',
            ipAddress,
            userAgent,
            details: { status: 'FAILED', reason: 'Account deactivated' }
        }); 
        throw new ApiError(401, "Your account has been deactivated.");
    }

    const passwordIsValid = user ? await userService.comparePassword(user, password) : false;
    
    // กรณี Login ล้มเหลว (รหัสผิด หรือ หา User ไม่เจอ)
    if (!user || !passwordIsValid) {
        // บันทึกความพยายาม Login ล้มเหลว
        await systemLogService.createLog({
            userId: user ? user.id : null,
            action: 'LOGIN',
            ipAddress,
            userAgent,
            details: { status: 'FAILED', reason: 'Invalid credentials', attemptedIdentifier: email || username }
        });
        throw new ApiError(401, "Invalid credentials");
    }

    // กรณี Login สำเร็จ
    const token = signToken({ sub: user.id, role: user.role, email: user.email });
    
    // บันทึกการเข้าสู่ระบบสำเร็จ
    await systemLogService.createLog({
        userId: user.id,
        action: 'LOGIN',
        ipAddress,
        userAgent,
        details: { status: 'SUCCESS' }
    });

    const {
        password:_,
        gender,
        phoneNumber,
        otpCode,
        nationalIdNumber,
        nationalIdPhotoUrl,
        nationalIdExpiryDate,
        selfiePhotoUrl,
        isVerified,
        isActive,
        lastLogin,
        createdAt,
        updatedAt,
        username:__,
        email:___,
        ...safeUser
    } = user;

    res.status(200).json({
        success: true,
        message: "Login successful",
        data: { token, user: safeUser }
    });
});

const changePassword = asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const { currentPassword, newPassword } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const result = await userService.updatePassword(userId, currentPassword, newPassword);

    if (!result.success) {
        // บันทึกเมื่อเปลี่ยนรหัสผ่านไม่สำเร็จ
        await systemLogService.createLog({
            userId,
            action: 'UPDATE_DATA',
            targetTable: 'User',
            targetId: userId,
            ipAddress,
            userAgent,
            details: { field: 'password', status: 'FAILED', error: result.error }
        });
        if (result.error === 'INCORRECT_PASSWORD') {
            throw new ApiError(401, 'Incorrect current password.');
        }
        throw new ApiError(500, 'Could not update password.');
    }

    // บันทึกเมื่อเปลี่ยนรหัสผ่านสำเร็จ
    await systemLogService.createLog({
        userId,
        action: 'UPDATE_DATA',
        targetTable: 'User',
        targetId: userId,
        ipAddress,
        userAgent,
        details: { field: 'password', status: 'SUCCESS' }
    });

    res.status(200).json({
        success: true,
        message: "Password changed successfully",
        data: null
    });
});

module.exports = { login, changePassword };