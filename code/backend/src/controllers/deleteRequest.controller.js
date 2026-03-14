const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");

class DeleteRequestController {
    constructor(deleteRequestService) {
        this.deleteRequestService = deleteRequestService;
    }

    // ฟังก์ชันสำหรับตรวจสอบข้อมูลก่อนส่งคำขอลบ
    // GET /api/delete-request/check-infos
    checkInfoBeforeDelete = asyncHandler(async (req, res) => {
        const userId = req.user.sub;
        const infoList = await this.deleteRequestService.checkInfoBeforeDelete(userId);
        return res.status(200).json(infoList);
    });

    // ฟังก์ชันสำหรับส่งคำขอลบข้อมูล
    // POST /api/delete-request
    sendDeleteRequest = asyncHandler(async (req, res) => {
        const userId = req.user.sub;
        const { deleteUserRequest, deleteVehicleRequest, deleteRouteRequest, deleteBookingRequest } = req.body;
        const { dataUserRequest, dataVehicleRequest, dataRouteRequest, dataBookingRequest } = req.body;

        // ตรวจสอบว่ามีการส่งคำขอลบอย่างน้อยหนึ่งรายการหรือไม่
        if (!deleteUserRequest && !deleteVehicleRequest && !deleteRouteRequest && !deleteBookingRequest) {
            throw new ApiError(400, "At least one delete request must be true.");
        }

        await this.deleteRequestService.sendDeleteRequest({
                deleteUserRequest : deleteUserRequest,
                deleteVehicleRequest : deleteVehicleRequest,
                deleteRouteRequest : deleteRouteRequest,
                deleteBookingRequest : deleteBookingRequest
            }, {
                dataUserRequest : dataUserRequest,
                dataVehicleRequest : dataVehicleRequest,
                dataRouteRequest : dataRouteRequest,
                dataBookingRequest : dataBookingRequest
            },
            userId
        );
        
        return res.status(200).json({
            success: true,
            message: "Delete request sent successfully",
        });
    });

    // ฟังก์ชันสำหรับตรวจสอบว่าผู้ใช้สามารถลบบัญชีได้หรือไม่ (เช่น ไม่มีเส้นทางที่เปิดอยู่ หรือการจองที่ยังไม่เสร็จสมบูรณ์)
    checkCanDeleteAccount = asyncHandler(async (req, res) => {
        const userId = req.user.sub;
        const canDeleteResult = await this.deleteRequestService.checkCanDeleteAccount(userId);
        return res.status(200).json(canDeleteResult);
    });
}
module.exports = DeleteRequestController;