const asyncHandler = require('express-async-handler');
const { signToken } = require("../utils/jwt");
const userService = require("../services/user.service");
const systemLogService = require('../services/systemLog.service');
const ApiError = require('../utils/ApiError');

const login = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    let user;
    if (email) {
        user = await userService.getUserByEmail(email);
    } else if (username) {
        user = await userService.getUserByUsername(username);
    }

    if (user && !user.isActive) {
        throw new ApiError(401, "Your account has been deactivated.");
    }

    const passwordIsValid = user ? await userService.comparePassword(user, password) : false;
    if (!user || !passwordIsValid) {
        // Log failed login attempt
        try {
            await systemLogService.createLog({
                userId: user ? user.id : null,
                action: 'LOGIN',
                level: 'WARNING',
                resource: 'Auth',
                ipAddress: req.ip || req.socket.remoteAddress,
                userAgent: req.get('User-Agent'),
                status: 'FAILED',
                details: { identifier: email || username }
            });
        } catch (e) {
            // ignore logging errors
            console.error('Failed to create login failure log', e.message);
        }

        throw new ApiError(401, "Invalid credentials");
    }

    const token = signToken({ sub: user.id, role: user.role });
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

    // Log successful login
    try {
        await systemLogService.createLog({
            userId: user.id,
            action: 'LOGIN',
            level: 'INFO',
            resource: 'Auth',
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.get('User-Agent'),
            status: 'SUCCESS',
            details: { message: 'User logged in successfully' }
        });
    } catch (e) {
        console.error('Failed to create login success log', e.message);
    }

    res.status(200).json({
        success: true,
        message: "Login successful",
        data: { token, user: safeUser }
    });
});

// Logout endpoint: record logout action server-side
const logout = asyncHandler(async (req, res) => {
    try {
        await systemLogService.createLog({
            userId: req.user ? req.user.sub : null,
            action: 'LOGOUT',
            level: 'INFO',
            resource: 'Auth',
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.get('User-Agent'),
            status: 'SUCCESS',
            details: { message: 'User logged out via API' }
        });
    } catch (e) {
        console.error('Failed to create logout log', e.message);
    }

    res.status(200).json({ success: true, message: 'Logged out' });
});

const changePassword = asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const { currentPassword, newPassword } = req.body;

    const result = await userService.updatePassword(userId, currentPassword, newPassword);

    if (!result.success) {
        if (result.error === 'INCORRECT_PASSWORD') {
            throw new ApiError(401, 'Incorrect current password.');
        }
        throw new ApiError(500, 'Could not update password.');
    }

    res.status(200).json({
        success: true,
        message: "Password changed successfully",
        data: null
    });
});

module.exports = { login, changePassword, logout };