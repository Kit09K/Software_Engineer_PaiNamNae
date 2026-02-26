const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

class SoftDeleteService {

    // สร้างคำขอลบข้อมูลแบบ Soft Delete
    static async createDeleteRequest(
        userId,
        deleteUserRequest = false,
        deleteVehicleRequest = false,
        deleteRouteRequest = false,
        deleteBookingRequest = false
    ) {
        const deleteRequest = await prisma.deleteRequest.create({
            data: {
                userId : userId,
                deleteUserRequest : deleteUserRequest,
                deleteVehicleRequest : deleteVehicleRequest,
                deleteRouteRequest : deleteRouteRequest,
                deleteBookingRequest : deleteBookingRequest,
                requestAt : new Date(),
                deleteAt : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Set deleteAt to 30 days from now
            }
        });
        return deleteRequest;
    }

    // ดึงคำขอลบข้อมูลโดยใช้ userId
    static async getDeleteRequestByUserId(userId) {
        const deleteRequest = await prisma.deleteRequest.findFirst({
            where: { userId: userId },
        });
        if (!deleteRequest) {
            throw new ApiError(404, 'Delete request not found');
        }
        return deleteRequest;
    }

    // เปลี่ยนสถานะ isDeleted ของ User เป็น true
    static async softDeleteUser(userId) {
        await prisma.user.update({
            where: { id : userId },
            data: { 
                isDeleted: true
            },
        });
    }

    // เปลี่ยนสถานะ isDeleted ของ Vehicle เป็น true
    static async softDeleteVehicles(userId) {
        await prisma.vehicle.updateMany({
            where: { userId: userId },
            data: { isDeleted: true },
        });
    }

    // เปลี่ยนสถานะ isDeleted ของ Route เป็น true
    static async softDeleteRoutes(userId) {
        await prisma.route.updateMany({
            where: { driverId: userId },
            data: { isDeleted: true },
        });
    }

    // เปลี่ยนสถานะ isDeleted ของ Booking เป็น true
    static async softDeleteBookings(userId) {
        await prisma.booking.updateMany({
            where: { passengerId: userId },
            data: { isDeleted: true },
        });
    }

}
module.exports = SoftDeleteService;