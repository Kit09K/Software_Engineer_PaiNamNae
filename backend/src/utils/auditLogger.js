// backend/src/utils/auditLogger.js
const prisma = require('../lib/prisma'); 

const auditLog = async (req, action, details = {}, targetTable = null, targetId = null) => {
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const userId = req.user?.id || details?.userId;

  try {
    await prisma.systemLog.create({
      data: {
        userId: userId || null,
        action: action,
        ipAddress: ipAddress,
        userAgent: userAgent,
        targetTable: targetTable,
        targetId: targetId,
        details: details,
      },
    });
  } catch (error) {
    console.error('Manual Audit Log Failed:', error);
  }
};

module.exports = { auditLog };