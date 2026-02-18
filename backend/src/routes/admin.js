// backend/src/routes/admin.js
const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const contextMiddleware = require('../middlewares/contextMiddleware'); 


// GET /api/admin/logs
router.get(
    '/logs', 
    // protect,  // uncomment เมื่อทำ auth เสร็จ
    // admin,    // uncomment เมื่อทำ auth เสร็จ
    contextMiddleware,
    logController.getSystemLogs
);

// GET /api/admin/logs/export
router.get(
    '/logs/export',
    // protect,
    // admin,
    contextMiddleware,
    logController.exportSystemLogs
);

module.exports = router;
