const prisma = require('../utils/prisma'); 

// Service สำหรับจัดการ System Logs ตาม พ.ร.บ. คอมพิวเตอร์ และ PDPA

const createLog = async (logData) => {
  const { userId, action, ipAddress, userAgent, targetTable, targetId, details } = logData;

  return await prisma.systemLog.create({
    data: {
      userId,
      action,
      ipAddress,
      userAgent,
      targetTable,
      targetId,
      details: details || {}, // เก็บรายละเอียดเพิ่มเติมในรูปแบบ JSON
    },
  });
};

// ดึงข้อมูล Logs ทั้งหมดสำหรับ Admin (รองรับ Pagination และ Filtering)
const queryLogs = async (filter, options) => {
  const { action, startDate, endDate, userId } = filter;
  const { limit = 50, page = 1 } = options;
  const skip = (page - 1) * limit;

  const where = {
    ...(action && { action }),
    ...(userId && { userId }),
    ...(startDate && endDate && {
      timestamp: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    }),
  };

  const [totalResults, results] = await Promise.all([
    prisma.systemLog.count({ where }),
    prisma.systemLog.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' }, 
      take: limit,
      skip,
    }),
  ]);

  return {
    results,
    page,
    limit,
    totalPages: Math.ceil(totalResults / limit),
    totalResults,
  };
};

// ดึงข้อมูล Log รายรายการตาม ID
const getLogById = async (logId) => {
  return await prisma.systemLog.findUnique({
    where: { id: logId },
    include: {
      user: {
        select: {
          username: true,
          email: true,
        },
      },
    },
  });
};

module.exports = {
  createLog,
  queryLogs,
  getLogById,
};