const asyncHandler = require('express-async-handler');
const hashChainService = require('../services/hashChain.service');

/**
 * ตรวจสอบ integrity ของ log blocks ทั้งหมดผ่าน anchors
 * GET /api/logs/verify-anchors
 */
const verifyAnchors = asyncHandler(async (req, res) => {
  const result = await hashChainService.verifyAnchors();

  res.status(200).json({
    success: true,
    message: 'Log integrity verification completed',
    data: result,
  });
});

/**
 * ตรวจสอบ hash chain ของ block ที่ระบุ
 * GET /api/logs/verify-block?start=1&end=100
 */
const verifyBlock = asyncHandler(async (req, res) => {
  const start = parseInt(req.query.start, 10);
  const end = parseInt(req.query.end, 10);

  if (!start || !end || start < 1 || end < start) {
    return res.status(400).json({
      success: false,
      message: 'Invalid range. Provide valid start and end parameters (start >= 1, end >= start).',
    });
  }

  const result = await hashChainService.verifyBlock(start, end);

  res.status(200).json({
    success: true,
    message: 'Block verification completed',
    data: result,
  });
});

module.exports = {
  verifyAnchors,
  verifyBlock,
};
