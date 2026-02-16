const asyncHandler = require("express-async-handler");
const DeleteService = require("../services/delete.service");
const VehicleService = require("../services/vehicle.service");
const RouteService = require("../services/route.service");
const BookingService = require("../services/booking.service");
const UserService = require("../services/user.service");
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
        }

    })    
}

module.exports = DeleteController;