const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

class DeleteRequestService {
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
            where: {
                 userId: userId,
                 status: 'PENDING'
            },
        });
        if (!deleteRequest) {
            throw new ApiError(404, 'Delete request not found');
        }
        return deleteRequest;
    }

    // ดึงคำขอลบข้อมูลที่สถานะยังเป็น PENDING และ deleteAt น้อยกว่าหรือเท่ากับวันที่ปัจจุบัน
    static async getDeleteRequestlteDeleteAt(currentDate) {
        const deleteRequests = await prisma.deleteRequest.findMany({
            where: {
                status: 'PENDING',
                deleteAt: {
                    lte: currentDate
                }
            }
        });
        if (!deleteRequests || deleteRequests.length === 0) {
            console.log('No pending delete requests found that are due for deletion.');
            return [];
        }
        return deleteRequests;
    }

    // อัปเดตสถานะคำขอลบข้อมูลเป็น DELETED หลังจากทำการลบข้อมูลจริงแล้ว
    static async completeDeleteRequest(tx, deleteRequestId) {
        await tx.deleteRequest.update({
            where: { id: deleteRequestId },
            data: { status: 'DELETED' }
        });
    }
}

module.exports = DeleteRequestService;