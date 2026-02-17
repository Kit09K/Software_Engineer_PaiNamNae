const asyncHandler = require('express-async-handler');
const { signToken } = require("../utils/jwt");
const userService = require("../services/user.service");
const ApiError = require('../utils/ApiError');
const prisma = require('../lib/prisma'); 

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
        throw new ApiError(401, "Invalid credentials");
    }


    const token = signToken({ sub: user.id, role: user.role });

    try {
        await prisma.systemLog.create({
            data: {
                action: 'LOGIN',
                // status: 'SUCCESS',
                // resource: 'User',
                // resourceId: user.id,
                targetTable: 'User',
                userId: user.id,
                ipAddress: req.ip || req.connection.remoteAddress || '0.0.0.0', 
                userAgent: req.headers['user-agent'], 
                details: { 
                    loginMethod: email ? 'email' : 'username' 
                }
            }
        });

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

    } catch (logError) {
        console.error("Login logging failed:", logError);
        console.error("Login logging failed:", logError.message);
    }

    const {
        password: _,
        otpCode,
        nationalIdNumber, 
        nationalIdPhotoUrl,
        ...safeUser
    } = user;

    res.status(200).json({
        success: true,
        message: "Login successful",
        data: { token, user: safeUser }
    });
});

const changePassword = asyncHandler(async (req, res) => {
    // req.user.sub มาจาก Middleware verifyToken
    const userId = req.user.sub; 
    const { currentPassword, newPassword } = req.body;

    const result = await userService.updatePassword(userId, currentPassword, newPassword);

    if (!result.success) {
        if (result.error === 'INCORRECT_PASSWORD') {
            throw new ApiError(401, 'Incorrect current password.');
        }
        throw new ApiError(500, 'Could not update password.');
    }

    try {
        await prisma.systemLog.create({
            data: {
                action: 'CHANGE_PASSWORD',
                userId: userId,
                targetTable: 'User',
                targetId: userId,
                ipAddress: req.ip || req.connection.remoteAddress || '0.0.0.0',
                userAgent: req.headers['user-agent'],
                details: { 
                    message: 'User changed password successfully',
                    type: 'CHANGE_PASSWORD'
                }
            }
        });
    } catch (logError) {
        console.error("Change password logging failed:", logError);
    }

    res.status(200).json({
        success: true,
        message: "Password changed successfully",
        data: null
    });
});

const updateMe = asyncHandler(async (req, res) => {
    const userId = req.user.sub; 
    
    const updatedUser = await userService.updateUserById(userId, req.body); 

    try {
        await prisma.systemLog.create({
            data: {
                action: 'UPDATE_DATA',
                userId: userId,
                targetTable: 'User',
                targetId: userId,
                ipAddress: req.ip || req.connection.remoteAddress || '0.0.0.0',
                userAgent: req.headers['user-agent'],
                details: { 
                    message: 'User updated profile information',
                    updatedFields: Object.keys(req.body) 
                }
            }
        });
    } catch (logError) {
        console.error("Update data logging failed:", logError.message);
    }

    res.status(200).json({
        success: true,
        data: updatedUser
    });
});


const logout = asyncHandler(async (req, res) => {
    const userId = req.user?.sub || req.user?.id;
    const ipAddress = req.ip || req.connection.remoteAddress;

    try {
        await prisma.systemLog.create({
            data: {
                action: 'LOGOUT',
                userId: userId || null, 
                ipAddress: ipAddress,
                userAgent: req.headers['user-agent'],
                targetTable: 'User',
                targetId: userId || 'unknown',
                details: { 
                    message: userId ? 'User logged out successfully' : 'Logout called without valid user context' 
                }
            }
        });
    } catch (err) {
        console.error("Logout logging failed:", err);
    }

    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
});

module.exports = { login, changePassword,logout };
