const prisma = require('../utils/prisma');
const DeleteRequestService = require('./deleteRequest.service');
const { deleteFromCloudinary, extractPublicIdFromUrl } = require('../utils/cloudinary');
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
                // เช็คว่ามีข้อมูลในฟิลด์ photos ไหม
                if (vehicle.photos) {
                    let photoList = vehicle.photos;
                    
                    // ป้องกันกรณี Prisma คืนค่ามาเป็น String (บางครั้งเกิดขึ้นกับ JSON field)
                    if (typeof photoList === 'string') {
                        try { photoList = JSON.parse(photoList); } catch (e) { photoList = []; }
                    }

                    if (Array.isArray(photoList)) {
                        for (const photoObj of photoList) {
                            // สมมติว่าใน JSON ของคุณเก็บเป็น [ { "url": "...", "public_id": "..." }, ... ]
                            // หรือเก็บเป็น Array ของ String ตรงๆ [ "url1", "url2" ]
                            const imageUrl = typeof photoObj === 'string' ? photoObj : photoObj.url;
                            
                            const publicId = extractPublicIdFromUrl(imageUrl);
                            if (publicId) {
                                await deleteFromCloudinary(publicId);
                                console.log(` Deleted Vehicle Photo: ${publicId}`);
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

                if (user) {
                    // รายชื่อฟิลด์ที่มีโอกาสเก็บ URL รูปภาพในตาราง User
                    const userImageFields = [
                        'profilePicture', 
                        'nationalIdPhotoUrl', 
                        'selfiePhotoUrl'
                    ];

                    for (const field of userImageFields) {
                        const imageUrl = user[field];
                        if (imageUrl) {
                            const publicId = extractPublicIdFromUrl(imageUrl);
                            if (publicId) {
                                try {
                                    const result = await deleteFromCloudinary(publicId);
                                    console.log(`🗑️ Deleted User ${field}: ${publicId} | Result: ${result.result}`);
                                } catch (error) {
                                    console.error(`⚠️ Failed to delete ${field}: ${publicId}`, error.message);
                                }
                            }
                        }
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