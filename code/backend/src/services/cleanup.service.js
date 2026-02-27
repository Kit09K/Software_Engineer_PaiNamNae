const prisma = require('../utils/prisma');
const DeleteRequestService = require('./deleteRequest.service');
class CleanupService {
    constructor(deleteRequestService) {
        this.deleteRequestService = deleteRequestService;
    }
    async hardDeleteData(request) {
        const userId = request.userId;
        if (request.deleteVehicleRequest) {
            const vehicles = await prisma.vehicle.findMany({
                where: { userId: userId, isDeleted: true }
            });

            for (const vehicle of vehicles) {
                if (vehicle.photos) {
                    let photoList = [];
                    // แปลง JSON ให้เป็น Array
                    try {
                        photoList = typeof vehicle.photos === 'string' ? JSON.parse(vehicle.photos) : vehicle.photos;
                    } catch (e) { console.error("JSON parse error:", e); }

                    if (Array.isArray(photoList)) {
                        for (const photo of photoList) {
                            // รองรับทั้งแบบ ['url1', 'url2'] และ [{ url: '...' }]
                            const url = typeof photo === 'string' ? photo : photo.url;
                            const publicId = extractPublicIdFromUrl(url);
                            
                            if (publicId) {
                                try { await deleteFromCloudinary(publicId); } 
                                catch (err) { console.error(` ลบรูปรถไม่สำเร็จ: ${publicId}`); }
                            }
                        }
                    }
                }
            }
        }

        // 1.2 ลบรูปโปรไฟล์ผู้ใช้ (User) ที่เก็บเป็น String
        if (request.deleteUserRequest) {
            const user = await prisma.user.findFirst({
                where: { id: userId, isDeleted: true }
            });

            //  เปลี่ยน 'profileImage' เป็นชื่อฟิลด์จริงใน Database ของคุณนะครับ
            if (user && user.profileImage) { 
                const publicId = extractPublicIdFromUrl(user.profileImage);
                if (publicId) {
                    try { await deleteFromCloudinary(publicId); } 
                    catch (err) { console.error(` ลบรูปโปรไฟล์ไม่สำเร็จ: ${publicId}`); }
                }
            }
        }
        // ใช้ Transaction ครอบทั้งการลบข้อมูล และการเปลี่ยนสถานะ
        return await prisma.$transaction(async (tx) => {

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