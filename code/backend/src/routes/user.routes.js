const express = require('express');
const userController = require("../controllers/user.controller");
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload.middleware');
const { idParamSchema, createUserSchema, updateMyProfileSchema, updateUserByAdminSchema, updateUserStatusSchema, listUsersQuerySchema } = require('../validations/user.validation');
const { protect, requireAdmin } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/logging'); // นำเข้า Middleware logActivity มาใช้งาน

const router = express.Router();

// --- Admin Routes ---
// GET /api/users/admin
router.get(
    '/admin',
    protect,
    requireAdmin,
    logActivity('VIEW_DATA', 'User', 'INFO'), // ดักจับ admin ดูรายชื่อผู้ใช้
    validate({ query: listUsersQuerySchema }),
    userController.adminListUsers
);

// PUT /api/users/admin/:id
router.put(
    '/admin/:id',
    protect,
    requireAdmin,
    logActivity('UPDATE_DATA', 'User', 'WARNING'), // ดักจับ admin แก้ไขข้อมูล
    upload.fields([
        { name: 'nationalIdPhotoUrl', maxCount: 1 },
        { name: 'selfiePhotoUrl', maxCount: 1 },
        { name: 'profilePicture', maxCount: 1 },
    ]),
    validate({ params: idParamSchema, body: updateUserByAdminSchema }),
    userController.adminUpdateUser
);

// DELETE /api/users/admin/:id
router.delete(
    '/admin/:id',
    protect,
    requireAdmin,
    logActivity('DELETE_DATA', 'User', 'WARNING'), // ดักจับการลบ User
    validate({ params: idParamSchema }),
    userController.adminDeleteUser
);

// GET /api/users/admin/:id
router.get(
    '/admin/:id',
    protect,
    requireAdmin,
    logActivity('VIEW_DATA', 'User', 'INFO'),
    validate({ params: idParamSchema }),
    userController.getUserById
);

// PATCH /api/users/admin/:id/status
router.patch(
    '/admin/:id/status',
    protect,
    requireAdmin,
    logActivity('UPDATE_DATA', 'User', 'INFO'), // ดักจับ admin กดอนุมัติยืนยันตัวตน
    validate({ params: idParamSchema, body: updateUserStatusSchema }),
    userController.setUserStatus
);

// --- Public / User-specific Routes ---
// GET /api/users/me
router.get(
    '/me',
    protect,
    userController.getMyUser
);

// GET /api/users/:id
router.get(
    '/:id',
    validate({ params: idParamSchema }),
    userController.getUserPublicById
);

// POST /api/users
router.post(
    '/',
    logActivity('CREATE_DATA', 'User', 'INFO'), // ดักจับ เมื่อมีคนสมัครสมาชิกใหม่
    upload.fields([
        { name: 'nationalIdPhotoUrl', maxCount: 1 },
        { name: 'selfiePhotoUrl', maxCount: 1 }
    ]),
    validate({ body: createUserSchema }),
    userController.createUser
);

// PUT /api/users/me
router.put(
    '/me',
    protect,
    logActivity('UPDATE_DATA', 'User', 'INFO'), // ดักจับเมื่อ User แก้ไขโปรไฟล์ตัวเอง
    upload.fields([
        { name: 'nationalIdPhotoUrl', maxCount: 1 },
        { name: 'selfiePhotoUrl', maxCount: 1 },
        { name: 'profilePicture', maxCount: 1 },
    ]),
    validate({ body: updateMyProfileSchema }),
    userController.updateCurrentUserProfile
);

// DELETE /api/users/me (User ลบบัญชีตัวเอง)
router.delete(
    '/me',
    protect,
    logActivity('DELETE_DATA', 'User', 'WARNING'), // ดักจับเมื่อ User ลบตัวเอง
    userController.deleteMyUser 
);

module.exports = router;
