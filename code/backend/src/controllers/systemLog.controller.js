const asyncHandler = require('express-async-handler');
const systemLogService = require('../services/systemLog.service');
const ApiError = require('../utils/ApiError');

// ดึงรายการ Logs ทั้งหมดสำหรับหน้า Admin Panel
const getLogs = asyncHandler(async (req, res) => {
    // รับค่าจาก Query Params เพื่อใช้ในการกรองข้อมูล (filter)
    // trim the search string to avoid problems with leading/trailing whitespace
    const rawSearch = req.query.search;
    const trimmedSearch = rawSearch ? rawSearch.trim() : '';
    const filter = {
        action: req.query.action,
        userId: req.query.userId,
        level: req.query.level,       // เพิ่ม : กรองตามความรุนแรง (INFO, WARNING, ERROR)
        resource: req.query.resource, // เพิ่ม : กรองตามโมดูล (User, Booking, Route)
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        startTime: req.query.startTime,
        endTime: req.query.endTime,
        search: trimmedSearch // คำค้นหาแบบ text (username, ip, action, email)
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

const exportLogs = asyncHandler(async (req, res) => {
    const rawSearch = req.query.search;
    const trimmedSearch = rawSearch ? rawSearch.trim() : '';
    const filter = {
        action: req.query.action,
        userId: req.query.userId,
        level: req.query.level,
        resource: req.query.resource,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        startTime: req.query.startTime,
        endTime: req.query.endTime,
        search: trimmedSearch
    };

    const { fileContent, fileHash } = await systemLogService.exportLogsToJSON(filter);

    await systemLogService.createLog({
        userId: req.user.sub,
        action: 'EXPORT_LOGS',
        level: 'WARNING',
        resource: 'SystemLog',
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('User-Agent'),
        protocol: `${req.protocol.toUpperCase()}/${req.httpVersion}`,
        status: 'SUCCESS',
        details: { 
            message: 'Admin exported system logs securely', 
            filterUsed: filter,
            generatedHash: fileHash
        }
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=painamnae_logs_${Date.now()}.json`);
    
    res.setHeader('X-File-SHA256', fileHash);
    
    res.status(200).send(fileContent); 
});
const deleteOldLogs = asyncHandler(async (req, res) => {
    const daysToKeep = 90;
    const result = await systemLogService.deleteLogsOlderThan(daysToKeep);

    await systemLogService.createLog({
        userId: req.user ? req.user.sub : null, 
        action: 'DELETE_DATA',
        level: 'INFO',
        resource: 'SystemLog',
        ipAddress: req.ip || 'CRON_JOB',
        details: { message: `Deleted logs older than ${daysToKeep} days`, deletedCount: result.count }
    });

    res.status(200).json({
        success: true,
        message: `Successfully deleted ${result.count} logs older than 90 days.`,
        data: result
    });
});

module.exports = {
    getLogs,
    getLogById,
    exportLogs,
    deleteOldLogs
};
