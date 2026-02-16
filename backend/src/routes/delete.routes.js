const express = require('express');
const router = express.Router();

const DeleteController = require("../controllers/delete.controller");
const { protect, requireAdmin } = require('../middlewares/auth');

// POST /api/delete/account
router.post("/account", protect, DeleteController.softDeleteUser);

module.exports = router;