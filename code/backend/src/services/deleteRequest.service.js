const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');
const SoftDeleteService = require('./soft.delete.service');
const EmailService = require('./email.service');
const UserService = require('./user.service');
const VehicleService = require('./vehicle.service');
const RouteService = require('./route.service');
const BookingService = require('./booking.service');

class DeleteRequestService {
    constructor(emailService, softDeleteService) {
        this.emailService = emailService;
        this.softDeleteService = softDeleteService;
    }
    // สร้างคำขอลบข้อมูลแบบ Soft Delete
    async createDeleteRequest(
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
                deleteAt : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // Set deleteAt to 90 days from now
            }
        });
        return deleteRequest;
    }

    // ดึงคำขอลบข้อมูลโดยใช้ userId
    async getDeleteRequestByUserId(userId) {
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
    async getDeleteRequestlteDeleteAt(currentDate) {
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
    async completeDeleteRequest(tx, deleteRequestId) {
        await tx.deleteRequest.update({
            where: { id: deleteRequestId },
            data: { status: 'DELETED' }
        });
    }
    
    
    async checkCanDeleteAccount(userId) {
        const activeRoutes = await prisma.route.findFirst({
            where : {
                driverId : userId,
                status : {
                    in : ['AVAILABLE','FULL','IN_TRANSIT']
                }
            }
        });

        if (activeRoutes) {
            return { 
                canDelete: false, 
                reason: "ACTIVE_ROUTE", 
                message: "คุณมีเส้นทางที่เปิดรับผู้โดยสาร หรือกำลังเดินทางอยู่" 
            };
        }

        const activeBooking = await prisma.booking.findFirst({
            where: {
                passengerId: userId,
                status: { in: ['PENDING', 'CONFIRMED'] },
                route: {
                    status: { in: ['AVAILABLE', 'FULL', 'IN_TRANSIT'] },
                }
            }
        });
        if (activeBooking) {
            return { 
                canDelete: false, 
                reason: "ACTIVE_BOOKING", 
                message: "คุณมีการจองที่ยังไม่เสร็จสมบูรณ์" 
            };
        }

        return { canDelete: true };
    }

    // ฟังก์ชันสำหรับตรวจสอบข้อมูลก่อนส่งคำขอลบ
    async checkInfoBeforeDelete(userId) {
        const user = await UserService.getUserById(userId);
        const vehicles = await VehicleService.getAllVehicles(userId);
        const routes = await RouteService.getMyRoutes(userId);
        const bookings = await BookingService.getMyBookings(userId);
    
        let infoList = {
            user : true,
            vehicles : false,
            routes : false,
            bookings : false
        }

        if (vehicles && vehicles.length > 0) {
            infoList.vehicles = true;
        }
        if (routes && routes.length > 0) {
            infoList.routes = true;
        }
        if (bookings && bookings.length > 0) {
            infoList.bookings = true;
        }
        return infoList;
    }

    // ฟังก์ชันหลักสำหรับส่งคำขอลบข้อมูล และทำการ Soft Delete ข้อมูลที่เกี่ยวข้อง
    async sendDeleteRequest(deleteRequest,dataRequest,userId) {

        // ตรวจสอบว่าผู้ใช้สามารถลบบัญชีได้หรือไม่ (เช่น ไม่มีเส้นทางที่เปิดอยู่ หรือการจองที่ยังไม่เสร็จสมบูรณ์)
        const canDeleteResult = await this.checkCanDeleteAccount(userId);
        if (!canDeleteResult.canDelete) {
            throw new ApiError(400, canDeleteResult.message);
        }
        const deleteUserRequest = deleteRequest.deleteUserRequest;
        const deleteVehicleRequest = deleteRequest.deleteVehicleRequest;
        const deleteRouteRequest = deleteRequest.deleteRouteRequest;
        const deleteBookingRequest = deleteRequest.deleteBookingRequest;

        await this.createDeleteRequest(
            userId,
            deleteUserRequest,
            deleteVehicleRequest,
            deleteRouteRequest,
            deleteBookingRequest
        );

        let backupData = {
            userData: null,
            vehiclesData: null,
            routesData: null,
            bookingsData: null
        };
        const sendData = {
            deleteUserRequest : dataRequest.dataUserRequest,
            deleteVehicleRequest : dataRequest.dataVehicleRequest,
            deleteRouteRequest : dataRequest.dataRouteRequest,
            deleteBookingRequest : dataRequest.dataBookingRequest
        };

        const userInfo = await UserService.getUserById(userId);

        // เตรียมข้อมูลส่งในไฟล์ JSON แนบไปกับอีเมลตามคำขอลบที่ผู้ใช้เลือกไว้
        if (sendData.deleteUserRequest) {
            backupData.userData = userInfo;
        }

        if (sendData.deleteVehicleRequest) {
            backupData.vehiclesData = await VehicleService.getAllVehicles(userId);
        }

        if (sendData.deleteRouteRequest) {
            backupData.routesData = await RouteService.getMyRoutes(userId);
        }

        if (sendData.deleteBookingRequest) {
            backupData.bookingsData = await BookingService.getMyBookings(userId);
        }


        // ทำการ Soft Delete ข้อมูลที่เกี่ยวข้องตามคำขอลบ
        if (deleteUserRequest) {
            await this.softDeleteService.softDeleteUser(userId);
        }

        if (deleteVehicleRequest) {
            await this.softDeleteService.softDeleteVehicles(userId);
        }

        if (deleteRouteRequest) {
            await this.softDeleteService.softDeleteRoutes(userId);
        }

        if (deleteBookingRequest) {
            await this.softDeleteService.softDeleteBookings(userId);
        }

        
        await this.emailService.sendEmail({
            to: userInfo.email,
            subject: "คำขอลบข้อมูลของคุณได้รับการดำเนินการแล้ว",
            text: `เรียน คุณ${userInfo.firstName} ${userInfo.lastName},\n\nเราได้ดำเนินการตามคำขอลบข้อมูลของคุณเรียบร้อยแล้ว ข้อมูลที่ถูกลบมีดังนี้:\n\n` +
                `${backupData.userData ? "- ข้อมูลบัญชีผู้ใช้\n" : ""}` +
                `${backupData.vehiclesData ? "- ข้อมูลรถยนต์\n" : ""}` +
                `${backupData.routesData ? "- ข้อมูลเส้นทาง\n" : ""}` +
                `${backupData.bookingsData ? "- ข้อมูลการจอง\n" : ""}` +
                'โดยรูปภาพของคุณจะถูกลบออกจากระบบทั้งหมดภายใน 90 วัน กรุณาดาวน์โหลดข้อมูลที่คุณต้องการไว้ก่อนตาม link ที่อยู่ในไฟล์ JSON ที่ส่งมา และไม่สามารถกู้คืนได้อีกต่อไป\n\n' +
                `\nหากคุณมีคำถามเพิ่มเติมหรือต้องการความช่วยเหลือ กรุณาติดต่อทีมสนับสนุนของเราได้ตลอดเวลา\n\nขอบคุณที่ใช้บริการของเรา\nทีมงาน painamnae`,
            attachments: [{
                        filename: 'delete-receipt.json',
                        content: JSON.stringify(backupData, null, 2)
            }]
        });
    }
}

module.exports = DeleteRequestService;