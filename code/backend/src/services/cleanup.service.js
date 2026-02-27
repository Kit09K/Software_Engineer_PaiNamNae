const prisma = require('../utils/prisma');
const DeleteRequestService = require('./deleteRequest.service');
class CleanupService {
    constructor(deleteRequestService) {
        this.deleteRequestService = deleteRequestService;
    }
    async hardDeleteData(request) {
        // ใช้ Transaction ครอบทั้งการลบข้อมูล และการเปลี่ยนสถานะ
        return await prisma.$transaction(async (tx) => {
            const userId = request.userId;

            // 1. ลบ Booking 
            if (request.deleteBookingRequest) {
                await tx.booking.deleteMany({
                    where: { passengerId: userId, isDeleted: true }
                });
            }

            // 2. ลบ Route 
            if (request.deleteRouteRequest) {
                await tx.route.deleteMany({
                    where: { driverId: userId, isDeleted: true }
                });
            }

            // 3. ลบ Vehicle 
            if (request.deleteVehicleRequest) {
                await tx.vehicle.deleteMany({
                    where: { userId: userId, isDeleted: true }
                });
            }

            // 4. ลบ User (ต้นทาง)
            if (request.deleteUserRequest) {
                await tx.user.deleteMany({
                    where: { id: userId, isDeleted: true }
                });
            }

            // 5.เรียกใช้ฟังก์ชันอัปเดตสถานะ โดยส่ง tx เข้าไปด้วย
            await this.deleteRequestService.completeDeleteRequest(tx, request.id);
        });
    }

    async delete90DaysData() {
        const currentDate = new Date();
        const deleteRequests = await this.deleteRequestService.getDeleteRequestlteDeleteAt(currentDate);

        console.log(`[${currentDate.toISOString()}] Found ${deleteRequests.length} pending delete requests.`);

        for (const request of deleteRequests) {
            try {
                await this.hardDeleteData(request);
                console.log(`Success: Hard deleted request ID ${request.id}`);
            } catch (error) {
                console.error(`Error: Failed to process request ID ${request.id}`, error);
            }
        }
        console.log('Cleanup job finished.');
    }
}

module.exports = CleanupService;