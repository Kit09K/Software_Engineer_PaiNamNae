const asyncHandler = require("express-async-handler");
const DeleteService = require("../services/delete.service");
const VehicleService = require("../services/vehicle.service");
const RouteService = require("../services/route.service");
const BookingService = require("../services/booking.service");
const UserService = require("../services/user.service");
const systemLogService = require("../services/systemLog.service");
const ApiError = require("../utils/ApiError");
const EmailService = require("../services/email.service");

class DeleteController {
    // POST /delete/account
    static softDeleteUser = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const email = req.user.email;
        const {
            deleteAccount,
            deleteVehicles,
            deleteRoutes,
            deleteBookings,
            sendEmailCopy,
        } = req.body;

        const deleteReq = await DeleteService.createDeleteRequest(
            userId,
            deleteAccount,
            deleteVehicles,
            deleteRoutes,
            deleteBookings,
            sendEmailCopy
        );

        // บันทึก Log เมื่อมีการส่งคำขอเลิกใช้งาน/ลบข้อมูล (Compliance: PDPA Right to be forgotten)
        await systemLogService.createLog({
            userId,
            action: 'DELETE_DATA',
            targetTable: 'DeletionRequest',
            targetId: deleteReq.id,
            ipAddress,
            userAgent,
            details: { 
                type: 'REQUEST_SUBMITTED',
                options: { deleteAccount, deleteVehicles, deleteRoutes, deleteBookings }
            }
        });

        res.status(201).json({
            message: "Delete request created successfully",
        });

        try {
            const backupData = {
                requestDetails: deleteReq,
                userData: null,
                vehicles: [],
                routes: [],
                bookings: []
            };

            const deleteRequest = await DeleteService.getDeleteRequestByUserId(userId);
            
            // ประมวลผลลบข้อมูลส่วนต่างๆ
            if (deleteRequest.deleteAccount) {
                backupData.userData = await UserService.getUserById(userId);
                await DeleteService.markDeleteUserData(userId, deleteRequest);
            }
            if (deleteRequest.deleteVehicles) {
                backupData.vehicles = await VehicleService.getAllVehicles(userId);
                await DeleteService.markDeleteVehicles(userId, deleteRequest);
            }
            if (deleteRequest.deleteRoutes && req.user.role === 'DRIVER') {
                backupData.routes = await RouteService.getMyRoutes(userId);
                await DeleteService.markDeleteRoutes(userId, deleteRequest);
            }
            if (deleteRequest.deleteBookings) {
                backupData.bookings = await BookingService.getMyBookings(userId);
                await DeleteService.markDeleteBookings(userId, deleteRequest);
            }

            // บันทึก Log เมื่อระบบประมวลผลการลบ (Soft Delete) เสร็จสมบูรณ์
            await systemLogService.createLog({
                userId,
                action: 'DELETE_DATA',
                targetTable: 'User',
                targetId: userId,
                ipAddress,
                userAgent,
                details: { 
                    type: 'PROCESS_COMPLETED',
                    status: 'SUCCESS',
                    requestId: deleteReq.id 
                }
            });

            if (deleteRequest.sendEmailCopy) {
                await EmailService.sendEmail({
                    to: email,
                    subject: "Your Account Deletion Request Has Been Processed",
                    text: `Dear ${email},\n\nYour account deletion request has been processed successfully. All your data has been removed from our system.\n\nThank you for using our service.`,
                    attachments: [{
                        filename: 'delete-receipt.json',
                        content: JSON.stringify(backupData, null, 2)
                    }]
                });
            }
    
        }
        catch (error) {
            console.error("Error processing delete request:", error);

            // บันทึก Log กรณีการลบผิดพลาด เพื่อให้ Admin ตรวจสอบได้
            await systemLogService.createLog({
                userId,
                action: 'DELETE_DATA',
                ipAddress,
                details: { type: 'PROCESS_FAILED', error: error.message }
            });
        }

    })    
}

module.exports = DeleteController;