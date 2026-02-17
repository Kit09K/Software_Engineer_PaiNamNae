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
        const deleteRequest = await prisma.deletionRequest.create({
            data: {
                userId : userId,
                deleteAccount : deleteAccount,
                deleteVehicles : deleteVehicles,
                deleteRoutes : deleteRoutes,
                deleteBookings : deleteBookings,
                sendEmailCopy : sendEmailCopy,
                status: 'PENDING',
                requestedAt : new Date(),
                completedAt : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // set completion time to 90 days later,
            },
        });
        return deleteRequest;
    }
    // get delete request by user id
    static async getDeleteRequestByUserId(userId) {
        const deleteRequest = await prisma.deletionRequest.findFirst({
            where: { userId },
        });
        if (!deleteRequest) {
            throw new ApiError(404, 'Delete request not found');
        }
        return deleteRequest;
    }
    // set isDeleted to true for user and related data based on delete request
    static async markDeleteUserData(userId) {
        const markedUser = await prisma.user.update({
            where: { id: userId },
            data: { 
                isDeleted: true,
                deletedAt: new Date()
            },
        });
    }
    // set isDeleted to true for vehicles owned by user based on delete request
    static async markDeleteVehicles(userId) {
        const markedVehicles = await prisma.vehicle.updateMany({
            where: { userId: userId },
            data: { isDeleted: true },
        });
    }
    // set isDeleted to true for routes driven by user based on delete request
    static async markDeleteRoutes(userId) {
        const markedRoutes = await prisma.route.updateMany({
            where: { driverId: userId },
            data: { isCancelled: true },
        });
    }
    // set isDeleted to true for bookings made by user based on delete request
    static async markDeleteBookings(userId) {
        const markedBookings = await prisma.booking.updateMany({
            where: { passengerId: userId },
            data: { isAnonymized: true },
        });
    }
}

module.exports = DeleteService;