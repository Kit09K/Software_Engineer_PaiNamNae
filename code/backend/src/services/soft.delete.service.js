const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

class SoftDeleteService {
    constructor() {

    }
    // เปลี่ยนสถานะ isDeleted ของ User เป็น true
    async softDeleteUser(userId) {
        await prisma.user.update({
            where: { id : userId },
            data: { 
                isDeleted: true
            },
        });
    }

    // เปลี่ยนสถานะ isDeleted ของ Vehicle เป็น true
    async softDeleteVehicles(userId) {
        await prisma.vehicle.updateMany({
            where: { userId: userId },
            data: { isDeleted: true },
        });
    }

    // เปลี่ยนสถานะ isDeleted ของ Route เป็น true
    async softDeleteRoutes(userId) {
        await prisma.route.updateMany({
            where: { driverId: userId },
            data: { isDeleted: true },
        });
    }

    // เปลี่ยนสถานะ isDeleted ของ Booking เป็น true
    async softDeleteBookings(userId) {
        await prisma.booking.updateMany({
            where: { passengerId: userId },
            data: { isDeleted: true },
        });
    }

}
module.exports = SoftDeleteService;