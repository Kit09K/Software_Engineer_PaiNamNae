const express = require('express');
const router = express.Router();

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

// POST /api/delete-request
router.post(
        '/',
        protect, 
        deleteRequestController.sendDeleteRequest);

module.exports = router;