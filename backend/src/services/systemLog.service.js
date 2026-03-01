const prisma = require('../utils/prisma'); 

// Service สำหรับจัดการ System Logs ตาม พ.ร.บ. คอมพิวเตอร์ และ PDPA

// บันทึก log ลง database
const createLog = async (logData) => {
  const { userId, action, level, resource, ipAddress, userAgent, targetTable, targetId, details, errorMessage } = logData;

  return await prisma.systemLog.create({
    data: {
      userId,
      action,
      level: level || 'INFO', 
      resource: resource || targetTable || 'System', 
      ipAddress,
      userAgent,
      targetTable,
      targetId,
      details: details || {}, // เก็บรายละเอียดเพิ่มเติมในรูปแบบ JSON
      errorMessage,
    },
  });
};

// SELECT ข้อมูลเพื่อมาแสดง และ Filter_logs()
const queryLogs = async (filter, options) => {
  const { action, startDate, endDate, userId, level, resource } = filter;
  const { limit = 50, page = 1 } = options;
  const skip = (page - 1) * limit;

  // สร้างเงื่อนไขในการค้นหา (Filter)
  const where = {
    ...(action && { action }),
    ...(userId && { userId }),
    ...(level && { level }),       // เพิ่มการกรองตาม Level
    ...(resource && { resource }), // เพิ่มการกรองตาม Resource
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
            email: true,
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

// logs_export() (export log to JSON และสามารถ Filter ข้อมูลได้)
const exportLogsToJSON = async (filter) => {
  const { action, startDate, endDate, userId, level, resource } = filter;

  const where = {
    ...(action && { action }),
    ...(userId && { userId }),
    ...(level && { level }),
    ...(resource && { resource }),
    ...(startDate && endDate && {
      timestamp: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    }),
  };

  const logs = await prisma.systemLog.findMany({
    where,
    include: {
      user: {
        select: { username: true, email: true, role: true }
      }
    },
    orderBy: { timestamp: 'desc' },
  });

  return logs;
};

// static del_morethan90_log() (ลบ log หากเกิน 90 วัน)
const deleteLogsOlderThan = async (days) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const result = await prisma.systemLog.deleteMany({
    where: {
      timestamp: {
        lt: cutoffDate, 
      },
    },
  });

  return { count: result.count };
};

module.exports = {
  createLog,
  queryLogs,
  getLogById,
  exportLogsToJSON,
  deleteLogsOlderThan,
};