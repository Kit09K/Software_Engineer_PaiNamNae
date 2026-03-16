const crypto = require('crypto');

// ─── Configuration ───────────────────────────────────────────────────────────
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
  const canonicalTimestamp = logData.timestamp
    ? new Date(logData.timestamp).toISOString()
    : '';

  const payload =
    canonicalTimestamp +
    (logData.userId || '') +
    (logData.action || '') +
    (logData.apiPath || '') +
    (logData.ipAddress || '') +
    deterministicStringify(logData.details || {}) +
    (prevHash || '') +   // genesis: null → empty string
    SYSTEM_SECRET;

  return crypto.createHash('sha256').update(payload).digest('hex');
};

// ─── Verification Algorithm ─────────────────────────────────────────────────

const verifyChain = (logs) => {
  if (!logs || logs.length === 0) {
    return {
      mode: 'full-chain',
      totalLogs: 0,
      valid: true,
      status: 'OK',
      rows: [],
    };
  }

  const rows = [];
  let expectedPrevHash = null; // GENESIS: first log must have prevHash === null
  let firstCorruptedRow = null;

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    const issues = [];

    // ── Check 1: Chain Linkage ──
    // The log's prevHash must match the currentHash of the preceding log.
    // For the genesis log (i === 0), expectedPrevHash is null.
    if (log.prevHash !== expectedPrevHash) {
      issues.push({
        type: 'CHAIN_BREAK',
        detail: `prevHash mismatch: expected ${expectedPrevHash || 'null'}, got ${log.prevHash || 'null'}`,
      });
    }

    // ── Check 2: Hash Integrity ──
    // Recompute the hash from the log's own fields + its stored prevHash.
    // This detects if any field was modified after the hash was written.
    const recomputedHash = computeHash(log, log.prevHash);
    if (log.currentHash !== recomputedHash) {
      issues.push({
        type: 'HASH_MISMATCH',
        detail: `currentHash does not match recomputed hash (data may have been tampered)`,
        expected: recomputedHash,
        actual: log.currentHash,
      });
    }

    const rowStatus = issues.length > 0 ? 'CORRUPTED' : 'OK';

    if (rowStatus === 'CORRUPTED' && firstCorruptedRow === null) {
      firstCorruptedRow = i + 1; // 1-indexed
    }

    rows.push({
      row: i + 1,
      logId: log.id,
      action: log.action,
      prevHash: log.prevHash || 'GENESIS',
      currentHash: log.currentHash || '',
      status: rowStatus,
      ...(issues.length > 0 && { issues }),
    });

    // ── Advance the chain ──
    // The next log's prevHash must equal this log's currentHash
    expectedPrevHash = log.currentHash;
  }

  const valid = firstCorruptedRow === null;

  return {
    mode: 'full-chain',
    totalLogs: logs.length,
    valid,
    status: valid ? 'OK' : 'FAILED',
    rows,
    ...(firstCorruptedRow !== null && { firstCorruptedRow }),
  };
};


const verifyFullChainFromDB = async (prisma) => {
  const allLogs = await prisma.systemLog.findMany({
    orderBy: [{ timestamp: 'asc' }, { id: 'asc' }],
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

  return verifyChain(allLogs);
};

const verifyBlockFromDB = async (prisma, start, end) => {
  // Fetch the log immediately before the block to establish the chain's starting point
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

  // Fetch the block
  const blockLogs = await prisma.systemLog.findMany({
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

  if (blockLogs.length === 0) {
    return { status: 'OK', message: 'No logs found in this range.', logsChecked: 0 };
  }

  // Verify the block, but first check that the block's first entry links to the chain
  const result = verifyChain(blockLogs);

  // Additionally check the boundary: does blockLogs[0].prevHash match the preceding log?
  if (blockLogs[0].prevHash !== expectedPrevHash) {
    result.boundaryIssue = {
      type: 'BLOCK_BOUNDARY_BREAK',
      detail: `First log in block has prevHash=${blockLogs[0].prevHash || 'null'} but preceding log has currentHash=${expectedPrevHash || 'null'}`,
    };
    result.status = 'FAILED';
    result.valid = false;
  }

  return result;
};


const verifyAnchorsFromDB = async (prisma) => {
  const totalLogs = await prisma.systemLog.count();

  if (totalLogs < 100) {
    return await verifyFullChainFromDB(prisma);
  }

  const anchors = await prisma.logAnchor.findMany({
    orderBy: { createdAt: 'asc' },
  });

  if (anchors.length === 0) {
    const result = await verifyFullChainFromDB(prisma);
    return {
      ...result,
      anchorWarning: 'No anchor checkpoints found despite having 100+ logs. Full-chain verification used as fallback.',
    };
  }

  const corruptedBlocks = [];

  for (let i = 0; i < anchors.length; i++) {
    const anchor = anchors[i];

    const anchoredLog = await prisma.systemLog.findUnique({
      where: { id: anchor.lastLogId },
      select: { currentHash: true },
    });

    if (!anchoredLog || anchoredLog.currentHash !== anchor.anchorHash) {
      corruptedBlocks.push({
        block: i + 1,
        anchorId: anchor.id,
        expected: anchor.anchorHash,
        actual: anchoredLog ? anchoredLog.currentHash : 'LOG_NOT_FOUND',
      });
    }
  }

  return {
    mode: 'anchor',
    status: corruptedBlocks.length === 0 ? 'OK' : 'FAILED',
    blocksChecked: anchors.length,
    ...(corruptedBlocks.length > 0 && { corruptedBlocks }),
  };
};

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  computeHash,
  verifyChain,
  verifyFullChainFromDB,
  verifyBlockFromDB,
  verifyAnchorsFromDB,
};

// ─── CLI Usage (run directly with: node hash-chain-verifier.js) ──────────────

if (require.main === module) {
  // Demo: verify a small in-memory chain
  console.log('=== Hash Chain Verifier — Demo ===\n');

  const timestamp1 = new Date('2026-01-01T00:00:00.000Z');
  const timestamp2 = new Date('2026-01-01T00:01:00.000Z');
  const timestamp3 = new Date('2026-01-01T00:02:00.000Z');

  // Build a valid chain
  const log1 = {
    id: '1',
    timestamp: timestamp1,
    userId: 'user1',
    action: 'LOGIN',
    apiPath: '/api/auth/login',
    ipAddress: '127.0.0.1',
    details: {},
    prevHash: null,
  };
  log1.currentHash = computeHash(log1, null);

  const log2 = {
    id: '2',
    timestamp: timestamp2,
    userId: 'user1',
    action: 'VIEW_DATA',
    apiPath: '/api/data',
    ipAddress: '127.0.0.1',
    details: {},
    prevHash: log1.currentHash,
  };
  log2.currentHash = computeHash(log2, log2.prevHash);

  const log3 = {
    id: '3',
    timestamp: timestamp3,
    userId: 'user1',
    action: 'LOGOUT',
    apiPath: '/api/auth/logout',
    ipAddress: '127.0.0.1',
    details: {},
    prevHash: log2.currentHash,
  };
  log3.currentHash = computeHash(log3, log3.prevHash);

  // Verify valid chain
  console.log('1) Valid chain:');
  const validResult = verifyChain([log1, log2, log3]);
  console.log(`   Status: ${validResult.status} (${validResult.totalLogs} logs)\n`);

  // Simulate tampering: modify log2's action
  const tamperedLog2 = { ...log2, action: 'DELETE_DATA' };
  console.log('2) Tampered chain (log2 action changed):');
  const tamperedResult = verifyChain([log1, tamperedLog2, log3]);
  console.log(`   Status: ${tamperedResult.status}`);
  console.log(`   First corrupted row: ${tamperedResult.firstCorruptedRow}\n`);

  // Show detailed results
  tamperedResult.rows.forEach((r) => {
    const marker = r.status === 'CORRUPTED' ? '❌' : '✅';
    console.log(`   Row ${r.row}: ${marker} ${r.status} (${r.action})`);
    if (r.issues) {
      r.issues.forEach((i) => console.log(`      └─ ${i.type}: ${i.detail}`));
    }
  });
}
