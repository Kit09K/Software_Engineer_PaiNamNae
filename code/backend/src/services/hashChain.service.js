const crypto = require('crypto');
const prisma = require('../utils/prisma');

const SYSTEM_SECRET = process.env.LOG_HASH_SECRET || 'default_secret_change_me';


const sortKeys = (obj) => {
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);
  return Object.keys(obj).sort().reduce((sorted, key) => {
    sorted[key] = sortKeys(obj[key]);
    return sorted;
  }, {});
};

const deterministicStringify = (obj) => JSON.stringify(sortKeys(obj));


const computeHash = (logData, prevHash) => {
  // Canonical field extraction — explicitly pick only the fields that form the hash.
  // This ensures the same fields are used whether logData comes from createLog() or from a DB query.
  const canonicalTimestamp = logData.timestamp
    ? new Date(logData.timestamp).toISOString()
    : '';

  const payload =
    canonicalTimestamp +
    (logData.userId || '') +
    (logData.action || '') +
    (logData.apiPath || '') +
    (logData.ipAddress || '') +
    deterministicStringify(logData.details || {}) +  // sorted keys — immune to JSONB reordering
    (prevHash || '') +
    SYSTEM_SECRET;

  return crypto.createHash('sha256').update(payload).digest('hex');
};

/**
 * ดึง currentHash ของ log ล่าสุด
 * @returns {string|null}
 */
const getLastLogHash = async (tx = prisma) => {
  const lastLog = await tx.systemLog.findFirst({
    orderBy: [{ timestamp: 'desc' }, { id: 'desc' }], // deterministic: id tiebreaker matches verifyFullChain
    select: { currentHash: true },
  });
  return lastLog ? lastLog.currentHash : null;
};


const createAnchorIfNeeded = async (log) => {
  const totalLogs = await prisma.systemLog.count();
  if (totalLogs > 0 && totalLogs % 100 === 0) {
    await prisma.logAnchor.create({
      data: {
        lastLogId: log.id,
        anchorHash: log.currentHash,
      },
    });
    console.log(`📌 LogAnchor created at log #${totalLogs} (id: ${log.id})`);
  }
};


const verifyAnchors = async () => {
  const totalLogs = await prisma.systemLog.count();

  // Pre-anchor state: ใช้ full-chain verification
  if (totalLogs < 100) {
    return await verifyFullChain();
  }

  // Anchor-based verification
  const anchors = await prisma.logAnchor.findMany({
    orderBy: { createdAt: 'asc' },
  });

  if (anchors.length === 0) {
    // Anchor table is empty despite having >= 100 logs.
    // This indicates anchors were never created or were deleted.
    // Fall back to full-chain but signal the anomaly so the UI can warn the admin.
    const result = await verifyFullChain();
    return {
      ...result,
      anchorWarning: 'No anchor checkpoints found despite having 100+ logs. Anchors may have been deleted or never written. Full-chain verification used as fallback.',
    };
  }

  const corruptedBlocks = [];

  for (let i = 0; i < anchors.length; i++) {
    const anchor = anchors[i];
    const blockStart = i * 100 + 1;
    const blockEnd = (i + 1) * 100;

    // ดึง log ที่ตรงกับ anchor
    const anchoredLog = await prisma.systemLog.findUnique({
      where: { id: anchor.lastLogId },
      select: { currentHash: true },
    });

    if (!anchoredLog || anchoredLog.currentHash !== anchor.anchorHash) {
      corruptedBlocks.push({ start: blockStart, end: blockEnd });
    }
  }

  return {
    mode: 'anchor',
    status: corruptedBlocks.length === 0 ? 'OK' : 'FAILED',
    blocksChecked: anchors.length,
    ...(corruptedBlocks.length > 0 && { corruptedBlocks }),
  };
};

/**
 * Full-chain verification: ตรวจสอบ hash chain ทีละ row เมื่อ logs < 100
 * @returns {object} { mode, totalLogs, valid, rows, corruptedRow? }
 */
const verifyFullChain = async () => {
  const allLogs = await prisma.systemLog.findMany({
    orderBy: [{ timestamp: 'asc' }, { id: 'asc' }], // deterministic: id as tiebreaker for same-ms logs
    select: {
      id: true,
      timestamp: true,
      userId: true,
      action: true,
      apiPath: true,
      ipAddress: true,
      details: true,
      prevHash: true,
      currentHash: true,
    },
  });

  if (allLogs.length === 0) {
    return {
      mode: 'full-chain',
      totalLogs: 0,
      valid: true,
      status: 'OK',
      rows: [],
    };
  }

  const rows = [];
  let expectedPrevHash = null; // GENESIS: first log should have null prevHash
  let corruptedRow = null;

  for (let i = 0; i < allLogs.length; i++) {
    const log = allLogs[i];
    let rowStatus = 'OK';

    // ตรวจ prevHash
    if (log.prevHash !== expectedPrevHash) {
      rowStatus = 'CORRUPTED';
    }

    // คำนวณ hash ใหม่แล้วเทียบ
    const recomputedHash = computeHash(log, log.prevHash);
    if (log.currentHash !== recomputedHash) {
      rowStatus = 'CORRUPTED';
    }

    if (rowStatus === 'CORRUPTED' && corruptedRow === null) {
      corruptedRow = i + 1;
    }

    rows.push({
      row: i + 1,
      logId: log.id,
      action: log.action,
      prevHash: log.prevHash || 'GENESIS',
      currentHash: log.currentHash || '',
      status: rowStatus,
    });

    expectedPrevHash = log.currentHash;
  }

  const valid = corruptedRow === null;

  return {
    mode: 'full-chain',
    totalLogs: allLogs.length,
    valid,
    status: valid ? 'OK' : 'FAILED',
    rows,
    ...(corruptedRow !== null && { corruptedRow }),
  };
};

const verifyBlock = async (start, end) => {
  // ดึง log ตามลำดับ timestamp + id (deterministic tiebreaker เพื่อให้ผลลัพธ์สม่ำเสมอ)
  const allLogs = await prisma.systemLog.findMany({
    orderBy: [{ timestamp: 'asc' }, { id: 'asc' }],
    skip: start - 1,
    take: end - start + 1,
    select: {
      id: true,
      timestamp: true,
      userId: true,
      action: true,
      apiPath: true,
      ipAddress: true,
      details: true,
      prevHash: true,
      currentHash: true,
    },
  });

  if (allLogs.length === 0) {
    return { status: 'OK', message: 'No logs found in this range.', logsChecked: 0 };
  }

  const mismatches = [];

  // ดึง log ก่อน block เพื่อเอา prevHash ตัวแรก
  let expectedPrevHash = null;
  if (start > 1) {
    const prevLog = await prisma.systemLog.findMany({
      orderBy: [{ timestamp: 'asc' }, { id: 'asc' }],
      skip: start - 2,
      take: 1,
      select: { currentHash: true },
    });
    if (prevLog.length > 0) {
      expectedPrevHash = prevLog[0].currentHash;
    }
  }

  for (let i = 0; i < allLogs.length; i++) {
    const log = allLogs[i];

    // ตรวจ prevHash
    if (log.prevHash !== expectedPrevHash) {
      mismatches.push({
        logId: log.id,
        position: start + i,
        issue: 'prevHash mismatch',
        expected: expectedPrevHash,
        actual: log.prevHash,
      });
    }

    // คำนวณ hash ใหม่แล้วเทียบ
    const recomputedHash = computeHash(log, log.prevHash);
    if (log.currentHash !== recomputedHash) {
      mismatches.push({
        logId: log.id,
        position: start + i,
        issue: 'currentHash mismatch (data may have been tampered)',
        expected: recomputedHash,
        actual: log.currentHash,
      });
    }

    expectedPrevHash = log.currentHash;
  }

  return {
    status: mismatches.length === 0 ? 'OK' : 'FAILED',
    logsChecked: allLogs.length,
    ...(mismatches.length > 0 && { mismatches }),
  };
};

module.exports = {
  computeHash,
  getLastLogHash,
  createAnchorIfNeeded,
  verifyAnchors,
  verifyFullChain,
  verifyBlock,
};

// const crypto = require('crypto');
// const prisma = require('../utils/prisma');

// const SYSTEM_SECRET = process.env.LOG_HASH_SECRET || 'default_secret_change_me';

// /**
//  * คำนวณ SHA256 Hash สำหรับ log entry
//  * @param {object} logData - ข้อมูล log ที่ต้องการ hash
//  * @param {string|null} prevHash - hash ของ log ก่อนหน้า
//  * @returns {string} SHA256 hash string
//  */
// const computeHash = (logData, prevHash) => {
//   const payload =
//     (logData.timestamp ? logData.timestamp.toISOString() : '') +
//     (logData.userId || '') +
//     (logData.action || '') +
//     (logData.apiPath || '') +
//     (logData.ipAddress || '') +
//     JSON.stringify(logData.details || {}) +
//     (prevHash || '') +
//     SYSTEM_SECRET;

//   return crypto.createHash('sha256').update(payload).digest('hex');
// };

// /**
//  * ดึง currentHash ของ log ล่าสุด
//  * @returns {string|null}
//  */
// const getLastLogHash = async () => {
//   const lastLog = await prisma.systemLog.findFirst({
//     orderBy: { timestamp: 'desc' },
//     select: { currentHash: true },
//   });
//   return lastLog ? lastLog.currentHash : null;
// };

// /**
//  * สร้าง LogAnchor ถ้าจำนวน log หารด้วย 100 ลงตัว
//  * @param {object} log - log ที่เพิ่งถูกสร้าง
//  */
// const createAnchorIfNeeded = async (log) => {
//   const totalLogs = await prisma.systemLog.count();
//   if (totalLogs > 0 && totalLogs % 100 === 0) {
//     await prisma.logAnchor.create({
//       data: {
//         lastLogId: log.id,
//         anchorHash: log.currentHash,
//       },
//     });
//     console.log(`📌 LogAnchor created at log #${totalLogs} (id: ${log.id})`);
//   }
// };

// /**
//  * ตรวจสอบ integrity ของทุก anchor block
//  * ถ้า logs < 100 จะใช้ full-chain verification แทน
//  * @returns {object} { mode, status, ... }
//  */
// const verifyAnchors = async () => {
//   const totalLogs = await prisma.systemLog.count();

//   // Pre-anchor state: ใช้ full-chain verification
//   if (totalLogs < 100) {
//     return await verifyFullChain();
//   }

//   // Anchor-based verification
//   const anchors = await prisma.logAnchor.findMany({
//     orderBy: { createdAt: 'asc' },
//   });

//   if (anchors.length === 0) {
//     return await verifyFullChain();
//   }

//   const corruptedBlocks = [];

//   for (let i = 0; i < anchors.length; i++) {
//     const anchor = anchors[i];
//     const blockStart = i * 100 + 1;
//     const blockEnd = (i + 1) * 100;

//     // ดึง log ที่ตรงกับ anchor
//     const anchoredLog = await prisma.systemLog.findUnique({
//       where: { id: anchor.lastLogId },
//       select: { currentHash: true },
//     });

//     if (!anchoredLog || anchoredLog.currentHash !== anchor.anchorHash) {
//       corruptedBlocks.push({ start: blockStart, end: blockEnd });
//     }
//   }

//   return {
//     mode: 'anchor',
//     status: corruptedBlocks.length === 0 ? 'OK' : 'FAILED',
//     blocksChecked: anchors.length,
//     ...(corruptedBlocks.length > 0 && { corruptedBlocks }),
//   };
// };

// /**
//  * Full-chain verification: ตรวจสอบ hash chain ทีละ row เมื่อ logs < 100
//  * @returns {object} { mode, totalLogs, valid, rows, corruptedRow? }
//  */
// const verifyFullChain = async () => {
//   const allLogs = await prisma.systemLog.findMany({
//     orderBy: { timestamp: 'asc' },
//     select: {
//       id: true,
//       timestamp: true,
//       userId: true,
//       action: true,
//       apiPath: true,
//       ipAddress: true,
//       details: true,
//       prevHash: true,
//       currentHash: true,
//     },
//   });

//   if (allLogs.length === 0) {
//     return {
//       mode: 'full-chain',
//       totalLogs: 0,
//       valid: true,
//       status: 'OK',
//       rows: [],
//     };
//   }

//   const rows = [];
//   let expectedPrevHash = null; // GENESIS: first log should have null prevHash
//   let corruptedRow = null;

//   for (let i = 0; i < allLogs.length; i++) {
//     const log = allLogs[i];
//     let rowStatus = 'OK';

//     // ตรวจ prevHash
//     if (log.prevHash !== expectedPrevHash) {
//       rowStatus = 'CORRUPTED';
//     }

//     // คำนวณ hash ใหม่แล้วเทียบ
//     const recomputedHash = computeHash(log, log.prevHash);
//     if (log.currentHash !== recomputedHash) {
//       rowStatus = 'CORRUPTED';
//     }

//     if (rowStatus === 'CORRUPTED' && corruptedRow === null) {
//       corruptedRow = i + 1;
//     }

//     rows.push({
//       row: i + 1,
//       logId: log.id,
//       action: log.action,
//       prevHash: log.prevHash || 'GENESIS',
//       currentHash: log.currentHash || '',
//       status: rowStatus,
//     });

//     expectedPrevHash = log.currentHash;
//   }

//   const valid = corruptedRow === null;

//   return {
//     mode: 'full-chain',
//     totalLogs: allLogs.length,
//     valid,
//     status: valid ? 'OK' : 'FAILED',
//     rows,
//     ...(corruptedRow !== null && { corruptedRow }),
//   };
// };

// /**
//  * ตรวจสอบ hash chain ของ block ที่ระบุ (start-end เป็นลำดับที่ของ log)
//  * @param {number} start - ลำดับเริ่มต้น (1-based)
//  * @param {number} end - ลำดับสิ้นสุด (1-based)
//  * @returns {object} ผลการตรวจสอบ
//  */
// const verifyBlock = async (start, end) => {
//   // ดึง log ตามลำดับ timestamp
//   const allLogs = await prisma.systemLog.findMany({
//     orderBy: { timestamp: 'asc' },
//     skip: start - 1,
//     take: end - start + 1,
//     select: {
//       id: true,
//       timestamp: true,
//       userId: true,
//       action: true,
//       apiPath: true,
//       ipAddress: true,
//       details: true,
//       prevHash: true,
//       currentHash: true,
//     },
//   });

//   if (allLogs.length === 0) {
//     return { status: 'OK', message: 'No logs found in this range.', logsChecked: 0 };
//   }

//   const mismatches = [];

//   // ดึง log ก่อน block เพื่อเอา prevHash ตัวแรก
//   let expectedPrevHash = null;
//   if (start > 1) {
//     const prevLog = await prisma.systemLog.findMany({
//       orderBy: { timestamp: 'asc' },
//       skip: start - 2,
//       take: 1,
//       select: { currentHash: true },
//     });
//     if (prevLog.length > 0) {
//       expectedPrevHash = prevLog[0].currentHash;
//     }
//   }

//   for (let i = 0; i < allLogs.length; i++) {
//     const log = allLogs[i];

//     // ตรวจ prevHash
//     if (log.prevHash !== expectedPrevHash) {
//       mismatches.push({
//         logId: log.id,
//         position: start + i,
//         issue: 'prevHash mismatch',
//         expected: expectedPrevHash,
//         actual: log.prevHash,
//       });
//     }

//     // คำนวณ hash ใหม่แล้วเทียบ
//     const recomputedHash = computeHash(log, log.prevHash);
//     if (log.currentHash !== recomputedHash) {
//       mismatches.push({
//         logId: log.id,
//         position: start + i,
//         issue: 'currentHash mismatch (data may have been tampered)',
//         expected: recomputedHash,
//         actual: log.currentHash,
//       });
//     }

//     expectedPrevHash = log.currentHash;
//   }

//   return {
//     status: mismatches.length === 0 ? 'OK' : 'FAILED',
//     logsChecked: allLogs.length,
//     ...(mismatches.length > 0 && { mismatches }),
//   };
// };

// module.exports = {
//   computeHash,
//   getLastLogHash,
//   createAnchorIfNeeded,
//   verifyAnchors,
//   verifyFullChain,
//   verifyBlock,
// };
