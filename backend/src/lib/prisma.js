const { PrismaClient } = require('@prisma/client');
const { getContext } = require('../utils/context');

const isProduction = process.env.NODE_ENV === 'production';


const SENSITIVE_MODELS = ['DriverVerification', 'User'];
const ACTION_MAP = {
  create: 'CREATE_DATA',
  createMany: 'CREATE_DATA',
  update: 'UPDATE_DATA',
  updateMany: 'UPDATE_DATA',
  upsert: 'UPDATE_DATA',
  delete: 'DELETE_DATA',
  deleteMany: 'DELETE_DATA',
};

const createPrismaClient = () => {
  const prismaOriginal = new PrismaClient({
    log: isProduction ? ['error'] : ['query', 'error', 'warn'],
  });

  return prismaOriginal.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const ctx = getContext();

          const result = await query(args);

          if (model === 'SystemLog') return result;

          const userId = ctx?.userId || null;
          const ipAddress = ctx?.ipAddress || 'internal-server';
          const userAgent = ctx?.userAgent || 'unknown';

          if (Object.keys(ACTION_MAP).includes(operation)) {
            const action = ACTION_MAP[operation];
            
            let targetId = null;
            if (result && result.id) targetId = result.id;
            else if (args.where && args.where.id) targetId = args.where.id;

            prismaOriginal.systemLog.create({
              data: {
                userId,
                action,
                ipAddress,
                userAgent,
                targetTable: model,
                targetId: typeof targetId === 'string' ? targetId : JSON.stringify(targetId),
                details: { operation, args: JSON.stringify(args) }, 
              },
            }).catch(err => console.error('Auto-Log CUD Error:', err.message));
          }

          const isReadOperation = ['findUnique', 'findFirst', 'findMany'].includes(operation);
          if (isReadOperation && SENSITIVE_MODELS.includes(model)) {
            let isSensitiveAccess = false;
            
            if (model === 'DriverVerification') isSensitiveAccess = true;
            else if (model === 'User') {
              const select = args.select || {};
              if (select.nationalIdNumber || select.nationalIdPhotoUrl || select.nationalIdExpiryDate) {
                isSensitiveAccess = true;
              }
            }

            if (isSensitiveAccess) {
              prismaOriginal.systemLog.create({
                data: {
                  userId,
                  action: 'ACCESS_SENSITIVE_DATA',
                  ipAddress,
                  userAgent,
                  targetTable: model,
                  details: { operation, queryArgs: JSON.stringify(args) },
                },
              }).catch(err => console.error('Auto-Log Sensitive Error:', err.message));
            }
          }

          return result;
        },
      },
    },
  });
};

const globalForPrisma = global;

const prisma = globalForPrisma.prisma || createPrismaClient();

if (!isProduction) globalForPrisma.prisma = prisma;

module.exports = prisma;
