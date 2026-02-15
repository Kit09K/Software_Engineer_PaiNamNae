const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

class DeleteService {
    // create delete request
    static async createDeleteRequest(
        userId,
        deleteAccount = false,
        deleteVehicles = false,
        deleteRoutes = false,
        deleteBookings = false,
        sendEmailCopy = false
    ) {
        const deleteRequest = await prisma.deletionrequest.create({
            data: {
                userId : userId,
                deleteAccount : deleteAccount,
                deleteVehicles : deleteVehicles,
                deleteRoutes : deleteRoutes,
                deleteBookings : deleteBookings,
                sendEmailCopy : sendEmailCopy,
            },
        });
        return deleteRequest;
    }
    // get delete request by user id
    static async getDeleteRequestByUserId(userId) {
        const deleteRequest = await prisma.deletionrequest.findFirst({
            where: { userId },
        });
        return deleteRequest;
    }
    // set isDeleted to true for user and related data based on delete request
    static async markDeleteUserData(userId, deleteRequest) {
        const markedUser = await prisma.user.update({
            where: { id: userId },
            data: { isDeleted: deleteRequest.deleteAccount },
        });
        return markedUser;
    }
    // set isDeleted to true for vehicles owned by user based on delete request
    static async markDeleteVehicles(userId, deleteRequest) {
        const markedVehicles = await prisma.vehicle.updateMany({
            where: { ownerId: userId },
            data: { isDeleted: deleteRequest.deleteVehicles },
        });
        return markedVehicles;
    }
    // set isDeleted to true for routes driven by user based on delete request
    static async markDeleteRoutes(userId, deleteRequest) {
        const markedRoutes = await prisma.route.updateMany({
            where: { driverId: userId },
            data: { isDeleted: deleteRequest.deleteRoutes },
        });
        return markedRoutes;
    }
    // set isDeleted to true for bookings made by user based on delete request
    static async markDeleteBookings(userId, deleteRequest) {
        const markedBookings = await prisma.booking.updateMany({
            where: { userId },
            data: { isDeleted: deleteRequest.deleteBookings },
        });
        return markedBookings;
    }
}