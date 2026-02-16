const asyncHandler = require('express-async-handler');
const systemLogService = require('../services/systemLog.service');
const ApiError = require('../utils/ApiError');

// ดึงรายการ Logs ทั้งหมดสำหรับหน้า Admin Panel
const getLogs = asyncHandler(async (req, res) => {
    // รับค่าจาก Query Params เพื่อใช้ในการกรองข้อมูล
    const filter = {
        action: req.query.action,
        userId: req.query.userId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
    };

    const options = {
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 50,
    };

    const result = await systemLogService.queryLogs(filter, options);

    res.status(200).json({
        success: true,
        message: "System logs retrieved successfully",
        data: result.results,
        pagination: {
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
            totalResults: result.totalResults
        }
    });
});

// ดึงรายละเอียดของ Log แต่ละรายการ (ใช้ดู JSON details เชิงลึก)
// GET /api/system-logs/:id
const getLogById = asyncHandler(async (req, res) => {
    const log = await systemLogService.getLogById(req.params.id);

    if (!log) {
        throw new ApiError(404, 'System log not found');
    }

    res.status(200).json({
        success: true,
        message: "Log details retrieved successfully",
        data: log
    });
});

module.exports = {
    getLogs,
    getLogById
};