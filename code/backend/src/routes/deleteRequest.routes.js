const express = require('express');
const router = express.Router();
<<<<<<< HEAD
=======
const { logActivity } = require('../middlewares/logging');
>>>>>>> origin/StoryLog

const DeleteRequestController = require('../controllers/deleteRequest.controller');
const DeleteRequestService = require('../services/deleteRequest.service');
const SoftDeleteService = require('../services/soft.delete.service');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const EmailService = require('../services/email.service');

const emailService = new EmailService();
const softDeleteService = new SoftDeleteService();
const deleteRequestService = new DeleteRequestService(emailService, softDeleteService);
const deleteRequestController = new DeleteRequestController(deleteRequestService);

// GET /api/delete-request/check-infos
router.get(
        '/check-infos',
        protect,
        deleteRequestController.checkInfoBeforeDelete);

<<<<<<< HEAD
// POST /api/delete-request
router.post(
        '/',
        protect, 
=======
// POST /api/delete-request (สำหรับให้ User ยื่นคำขอลบข้อมูล Soft Delete)
router.post(
        '/',
        protect, 
        logActivity('DELETE_DATA', 'User', 'WARNING'), // ดักจับว่า User มากดยื่นขอลบ 
>>>>>>> origin/StoryLog
        deleteRequestController.sendDeleteRequest);

// GET /api/delete-request/check-can-delete
router.get(
        '/check-can-delete',
        protect, 
        deleteRequestController.checkCanDeleteAccount);

module.exports = router;