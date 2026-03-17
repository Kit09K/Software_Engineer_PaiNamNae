const prisma = require('../utils/prisma');
const crypto = require('crypto');
const hashChainService = require('./hashChain.service');


const createLog = async (logData) => {
  return await prisma.$transaction(async (tx) => {
    const { userId, action, apiPath, level, resource, ipAddress, userAgent, targetTable, targetId, details, errorMessage, status, protocol } = logData;

    // Step 1: ดึง hash ของ log ก่อนหน้า (within transaction to prevent race conditions)
    const prevHash = await hashChainService.getLastLogHash(tx);

    // Step 2: สร้าง log data สำหรับคำนวณ hash
    const timestamp = new Date();
    const logDetails = details || {};

    // Step 3: คำนวณ currentHash
    const currentHash = hashChainService.computeHash(
      { timestamp, userId, action, apiPath, ipAddress, details: logDetails },
      prevHash
    );

    // Step 4: สร้าง log พร้อม hash chain
    const newLog = await tx.systemLog.create({
      data: {
        timestamp,
        userId,
        action,
        apiPath,           // เพิ่ม API Path
        level: level || 'INFO',
        resource: resource || targetTable || 'System',
        ipAddress,
        userAgent,
        targetTable,
        targetId,
        details: logDetails,
        errorMessage,
        status: status || 'SUCCESS',
        protocol: protocol || 'HTTP/1.1',
        prevHash,
        currentHash,
      },
    });

    // Step 5: สร้าง LogAnchor ถ้าถึงทุก 100 logs (within transaction)
    const totalLogs = await tx.systemLog.count();
    if (totalLogs > 0 && totalLogs % 100 === 0) {
      await tx.logAnchor.create({
        data: {
          lastLogId: newLog.id,
          anchorHash: newLog.currentHash,
        },
      });
      console.log(`📌 LogAnchor created at log #${totalLogs} (id: ${newLog.id})`);
    }

    return newLog;
  }, {
    isolationLevel: 'Serializable',  // Prevents concurrent reads of stale prevHash
    timeout: 10000,                   // 10s timeout for safety
  });

  // Step 5: สร้าง LogAnchor ถ้าถึงทุก 100 logs
  await hashChainService.createAnchorIfNeeded(newLog);

  return newLog;
};

const queryLogs = async (filter, options) => {
  let { action, apiPath, startDate, endDate, startTime, endTime, userId, level, resource, search } = filter;
  if (search && typeof search === 'string') {
    search = search.trim();
    if (search === '') search = undefined;
  }
  const { limit = 50, page = 1 } = options;
  const skip = (page - 1) * limit;

  const where = {
    ...(action && { action }),
    ...(apiPath && { apiPath }),
    ...(userId && { userId }),
    ...(level && { level }),
    ...(resource && { resource }),
  };

  if (startDate) {
    const t = startTime && startTime.length === 5 ? startTime : '00:00';
    const gte = new Date(`${startDate}T${t}:00+07:00`);
    where.timestamp = { ...where.timestamp, gte };
  }
  if (endDate) {
    const t = endTime && endTime.length === 5 ? endTime : '23:59';
    const lte = new Date(`${endDate}T${t}:59+07:00`);
    where.timestamp = { ...where.timestamp, lte };
  }

  if (search) {
    const orConditions = [
      { ipAddress: { contains: search, mode: 'insensitive' } },
      { user: { username: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } }
    ];

    where.OR = orConditions;
  }

  console.log('queryLogs where=', JSON.stringify(where));
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

// const exportLogsToJSON = async (filter) => {
//   let { action, startDate, endDate, userId, level, resource, search } = filter;
//   if (search && typeof search === 'string') {
//     search = search.trim();
//     if (search === '') search = undefined;
//   }

//   const where = {
//     ...(action && { action }),
//     ...(userId && { userId }),
//     ...(level && { level }),
//     ...(resource && { resource }),
//     ...(startDate && endDate && {
//       timestamp: {
//         gte: new Date(startDate),
//         lte: new Date(endDate),
//       },
//     }),
//   };

//   if (search) {
//   where.OR = [
//     { ipAddress: { contains: search, mode: "insensitive" } },
//     { user: { username: { contains: search, mode: "insensitive" } } },
//     { user: { email: { contains: search, mode: "insensitive" } } }
//   ]
// }

//   // ดึงข้อมูลทั้งหมด
//   const logs = await prisma.systemLog.findMany({
//     where,
//     include: {
//       user: {
//         select: { username: true, email: true, role: true }
//       }
//     },
//     orderBy: { timestamp: 'asc' },
//   });

//   const rawDataString = JSON.stringify(logs);

//   const hashSignature = crypto
//     .createHash('sha256')
//     .update(rawDataString)
//     .digest('hex');

//   const exportPayload = {
//     metadata: {
//       exportedAt: new Date().toISOString(),
//       recordCount: logs.length,
//       filtersApplied: filter,
//       sha256_signature: hashSignature, 
//       warning: "Do not modify the 'data' array. Any changes will invalidate the sha256_signature."
//     },
//     data: logs 
//   };

//   return exportPayload;
// };

const exportLogsToJSON = async (filter) => {
  let { action, startDate, endDate, userId, level, resource, search } = filter;
  if (search && typeof search === 'string') {
    search = search.trim();
    if (search === '') search = undefined;
  }

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

  if (search) {
    where.OR = [
      { ipAddress: { contains: search, mode: "insensitive" } },
      { user: { username: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } }
    ];
  }

  // 1. ดึงข้อมูลทั้งหมด
  const logs = await prisma.systemLog.findMany({
    where,
    include: {
      user: {
        select: { username: true, email: true, role: true }
      }
    },
    orderBy: { timestamp: 'asc' },
  });

  // 2. สร้าง Payload ทั้งหมด (โดยไม่ต้องมี field sha256_signature อยู่ข้างใน)
  const exportPayload = {
    metadata: {
      exportedAt: new Date().toISOString(),
      recordCount: logs.length,
      filtersApplied: filter,
      // นำคำเตือนเรื่องการแก้ไขไฟล์ออก หรือเปลี่ยนบริบทได้เลย
      info: "To verify integrity, compare the file's SHA256 hash with the one provided by the system."
    },
    data: logs
  };

  // 3. แปลงเป็น JSON String ที่พร้อมจะเป็นเนื้อหาไฟล์
  // ใช้ null, 2 เพื่อจัด format ให้อ่านง่าย (หรือจะเว้นว่างไว้ก็ได้ แต่ตอน User ตรวจ ต้องเป๊ะตามนี้)
  const fileContentString = JSON.stringify(exportPayload, null, 2);

  // 4. ทำ SHA256 จากเนื้อหาของไฟล์ "ทั้งไฟล์"
  const fileHash = crypto
    .createHash('sha256')
    .update(fileContentString)
    .digest('hex');

  // 5. Return แยกกันระหว่างเนื้อหาไฟล์ และ ค่า Hash
  return {
    fileContent: fileContentString,
    fileHash: fileHash
  };
};



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
