// backend/src/lib/prisma.js
const { PrismaClient } = require('@prisma/client');
const { getContext } = require('../utils/context');

// ตั้งค่า Environment
const isProduction = process.env.NODE_ENV === 'production';

// Configuration
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

// 1. สร้าง Function สำหรับสร้าง Client พร้อม Extension
const createPrismaClient = () => {
  const prismaOriginal = new PrismaClient({
    log: isProduction ? ['error'] : ['query', 'error', 'warn'],
  });

  return prismaOriginal.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const ctx = getContext();

          // รัน Query จริงๆ ก่อน
          const result = await query(args);

          // ถ้าเป็นตาราง SystemLog ให้ข้ามทันที (ป้องกัน Loop)
          if (model === 'SystemLog') return result;

          // เตรียมข้อมูล Context
          const userId = ctx?.userId || null;
          const ipAddress = ctx?.ipAddress || 'internal-server';
          const userAgent = ctx?.userAgent || 'unknown';

          // --- Logic 1: Auto Log สำหรับ CUD (Create, Update, Delete) ---
          if (Object.keys(ACTION_MAP).includes(operation)) {
            const action = ACTION_MAP[operation];
            
            let targetId = null;
            if (result && result.id) targetId = result.id;
            else if (args.where && args.where.id) targetId = args.where.id;

            // ใช้ prismaOriginal เพื่อบันทึก Log (เลี่ยง Extension loop)
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

          // --- Logic 2: Sensitive Data Access ---
          const isReadOperation = ['findUnique', 'findFirst', 'findMany'].includes(operation);
          if (isReadOperation && SENSITIVE_MODELS.includes(model)) {
            let isSensitiveAccess = false;
            
            if (model === 'DriverVerification') isSensitiveAccess = true;
            else if (model === 'User') {
              const select = args.select || {};
              // เช็คว่ามีการเลือกดู field สำคัญหรือไม่
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

// 2. Singleton Pattern เพื่อป้องกัน Connection เต็มตอน Dev
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || createPrismaClient();

if (!isProduction) globalForPrisma.prisma = prisma;

module.exports = prisma;

// // backend/src/lib/prisma.js
// const { PrismaClient } = require('@prisma/client');
// const { getContext } = require('../utils/context');

// const SENSITIVE_MODELS = ['DriverVerification', 'User'];
// const ACTION_MAP = {
//   create: 'CREATE_DATA',
//   createMany: 'CREATE_DATA',
//   update: 'UPDATE_DATA',
//   updateMany: 'UPDATE_DATA',
//   upsert: 'UPDATE_DATA',
//   delete: 'DELETE_DATA',
//   deleteMany: 'DELETE_DATA',
// };

// const prismaOriginal = new PrismaClient();

// const prisma = prismaOriginal.$extends({
//   query: {
//     $allModels: {
//       async $allOperations({ model, operation, args, query }) {
//         const ctx = getContext();

//         const result = await query(args);

//         if (model === 'SystemLog') return result;

//         const userId = ctx?.userId || null;
//         const ipAddress = ctx?.ipAddress || 'internal-server';
//         const userAgent = ctx?.userAgent || 'unknown';

//         if (Object.keys(ACTION_MAP).includes(operation)) {
//           const action = ACTION_MAP[operation];
          
//           let targetId = null;
//           if (result && result.id) targetId = result.id;
//           else if (args.where && args.where.id) targetId = args.where.id;

//           prismaOriginal.systemLog.create({
//             data: {
//               userId,
//               action,
//               ipAddress,
//               userAgent,
//               targetTable: model,
//               targetId: typeof targetId === 'string' ? targetId : JSON.stringify(targetId),
//               details: { operation, args: JSON.stringify(args) }, 
//             },
//           }).catch(err => console.error('Auto-Log Error:', err));
//         }

//         const isReadOperation = ['findUnique', 'findFirst', 'findMany'].includes(operation);
//         if (isReadOperation && SENSITIVE_MODELS.includes(model)) {
//           let isSensitiveAccess = false;
//           if (model === 'DriverVerification') isSensitiveAccess = true;
//           else if (model === 'User') {
//             const select = args.select || {};
//             if (select.nationalIdNumber || select.nationalIdPhotoUrl || select.nationalIdExpiryDate) {
//               isSensitiveAccess = true;
//             }
//           }

//           if (isSensitiveAccess) {
//             prismaOriginal.systemLog.create({
//               data: {
//                 userId,
//                 action: 'ACCESS_SENSITIVE_DATA',
//                 ipAddress,
//                 userAgent,
//                 targetTable: model,
//                 details: { operation, queryArgs: JSON.stringify(args) },
//               },
//             }).catch(err => console.error('Sensitive-Log Error:', err));
//           }
//         }

//         return result;
//       },
//     },
//   },
// });

// module.exports = prisma;

// // backend/src/lib/prisma.js
// const { PrismaClient } = require('@prisma/client');
// const { getContext } = require('../utils/context');

// // รายชื่อ Table ที่ถือว่าเป็นข้อมูลอ่อนไหว
// const SENSITIVE_MODELS = ['DriverVerification', 'User'];

// // แปลง Operation ของ Prisma เป็น Action ใน Enum ของเรา
// const ACTION_MAP = {
//   create: 'CREATE_DATA',
//   createMany: 'CREATE_DATA',
//   update: 'UPDATE_DATA',
//   updateMany: 'UPDATE_DATA',
//   upsert: 'UPDATE_DATA',
//   delete: 'DELETE_DATA',
//   deleteMany: 'DELETE_DATA',
// };

// const prismaOriginal = new PrismaClient();

// const prisma = prismaOriginal.$extends({
//   query: {
//     $allModels: {
//       async $allOperations({ model, operation, args, query }) {
//         const ctx = getContext();
        
//         // รัน Query จริงๆ ก่อน
//         const result = await query(args);

//         // --- Logic การเก็บ Log ---
//         console.log('Context:', ctx)
//         if (model === 'SystemLog' || !ctx) {
//           return result;
//         }
//         // const userId = ctx?.userId || null;
//         // const ipAddress = ctx?.ipAddress || 'internal-server';

//         // บันทึก Log เสมอถ้าไม่ใช่การทำกับตาราง SystemLog เอง
// //         if (model !== 'SystemLog') {
// //         prismaOriginal.systemLog.create({
// //           data: {
// //             userId,
// //             action: action,
// //             ipAddress,
// //             // ... field อื่นๆ
// //           }
// //         }).catch(err => console.error('Auto-Log Error:', err));
// // }

//         // 1. ดักจับการแก้ไขข้อมูล (CUD)
//         if (Object.keys(ACTION_MAP).includes(operation)) {
//           const action = ACTION_MAP[operation];
          
//           let targetId = null;
//           if (result && result.id) targetId = result.id;
//           else if (args.where && args.where.id) targetId = args.where.id;

//           prismaOriginal.systemLog.create({
//             data: {
//               userId: ctx.userId || null,
//               action: action,
//               ipAddress: ctx.ipAddress || 'unknown',
//               userAgent: ctx.userAgent || 'unknown',
//               targetTable: model,
//               targetId: typeof targetId === 'string' ? targetId : JSON.stringify(targetId),
//               details: { operation, args: JSON.stringify(args) }, 
//             },
//           }).catch(err => console.error('Auto-Log Error:', err));
//         }

//         // 2. ดักจับการดูข้อมูลอ่อนไหว (Read Sensitive)
//         const isReadOperation = ['findUnique', 'findFirst', 'findMany'].includes(operation);
//         if (isReadOperation && SENSITIVE_MODELS.includes(model)) {
//           let isSensitiveAccess = false;
//           if (model === 'DriverVerification') isSensitiveAccess = true;
//           else if (model === 'User') {
//             const select = args.select || {};
//             if (select.nationalIdNumber || select.nationalIdPhotoUrl || select.nationalIdExpiryDate) {
//               isSensitiveAccess = true;
//             }
//           }

//           if (isSensitiveAccess) {
//             prismaOriginal.systemLog.create({
//               data: {
//                 userId: ctx.userId || null,
//                 action: 'ACCESS_SENSITIVE_DATA',
//                 ipAddress: ctx.ipAddress || 'unknown',
//                 userAgent: ctx.userAgent || 'unknown',
//                 targetTable: model,
//                 details: { operation, queryArgs: JSON.stringify(args) },
//               },
//             }).catch(err => console.error('Sensitive-Log Error:', err));
//           }
//         }

//         return result;
//       },
//     },
//   },
// });

// module.exports = prisma;