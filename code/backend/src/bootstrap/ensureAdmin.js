const prisma = require('../utils/prisma');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

module.exports = async function ensureAdmin() {
    const {
        ADMIN_EMAIL,
        ADMIN_USERNAME,
        ADMIN_PASSWORD,
        ADMIN_FIRST_NAME,
        ADMIN_LAST_NAME,
    } = process.env;

    if (!ADMIN_EMAIL || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
        console.warn('⚠️  Skipping auto-admin bootstrap: ADMIN_EMAIL/ADMIN_USERNAME/ADMIN_PASSWORD not fully set.');
        return;
    }

    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount > 0) {
        console.log('✔ Admin already exists. Skipping admin bootstrap.');
        return;
    }

    // หา user เดิมจาก email หรือ username (ถ้ามีจะอัปเกรดเป็น ADMIN)
    const existing = await prisma.user.findFirst({
        where: {
            OR: [{ email: ADMIN_EMAIL }, { username: ADMIN_USERNAME }],
        },
    });

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

    if (existing) {
        await prisma.user.update({
            where: { id: existing.id },
            data: {
                role: 'ADMIN',
                isVerified: true,
                isActive: true,
                password: passwordHash,
                ...(ADMIN_FIRST_NAME ? { firstName: ADMIN_FIRST_NAME } : {}),
                ...(ADMIN_LAST_NAME ? { lastName: ADMIN_LAST_NAME } : {}),
            },
        });

        // บันทึก log การอัปเกรดสิทธิ์ผู้ใช้เป็น Admin
        await prisma.systemLog.create({
            data: {
                action: 'UPDATE_DATA',
                level: 'WARNING', // ระบุเป็น WARNING เพราะการเปลี่ยนสิทธิ์เป็น Admin เป็นเรื่องสำคัญที่ควรสังเกตเห็นได้ชัดตอน Filter
                ipAddress: 'SYSTEM_BOOTSTRAP', // ใช้ชื่อระบบแทน IP เพราะรันจาก Script หลังบ้าน
                resource: 'User',
                targetTable: 'User',
                targetId: updatedUser.id,
                details: {
                    message: 'Elevated existing user to ADMIN via bootstrap script',
                    oldRole: existing.role,
                    newRole: 'ADMIN'
                }
            }
        });

        console.log(`🔐 Elevated existing user (${existing.email || existing.username}) to ADMIN.`);
    } else {
        await prisma.user.create({
            data: {
                email: ADMIN_EMAIL,
                username: ADMIN_USERNAME,
                password: passwordHash,
                firstName: ADMIN_FIRST_NAME || 'Admin',
                lastName: ADMIN_LAST_NAME || '',
                role: 'ADMIN',
                isVerified: true,
                isActive: true,
            },
        });

        // บันทึก log การสร้างบัญชี Admin ใหม่
        await prisma.systemLog.create({
            data: {
                action: 'CREATE_DATA',
                level: 'INFO',
                ipAddress: 'SYSTEM_BOOTSTRAP',
                resource: 'User',
                targetTable: 'User',
                targetId: newAdmin.id,
                details: {
                    message: 'Created initial ADMIN account via bootstrap script',
                    email: ADMIN_EMAIL
                }
            }
        });

        console.log(`🔐 Created initial ADMIN account (${ADMIN_EMAIL}).`);
    }
};