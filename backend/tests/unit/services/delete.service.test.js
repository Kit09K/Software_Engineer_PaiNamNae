const DeleteService = require('../../../src/services/delete.service'); // ปรับ Path ตามจริง
const prisma = require('../../../src/utils/prisma');

// 1. จำลอง (Mock) Prisma Client
jest.mock('../../../src/utils/prisma', () => ({
    deletionrequest: {
        create: jest.fn(),
        findFirst: jest.fn(),
    },
    user: {
        update: jest.fn(),
    },
    vehicle: {
        updateMany: jest.fn(),
    },
    route: {
        updateMany: jest.fn(),
    },
    booking: {
        updateMany: jest.fn(),
    },
}));

describe('DeleteService (Static Methods Test)', () => {
    const mockUserId = 101;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createDeleteRequest()', () => {
        it('should call prisma.deletionrequest.create with correct data', async () => {
            const mockResponse = { id: 1, userId: mockUserId };
            prisma.deletionrequest.create.mockResolvedValue(mockResponse);

            const result = await DeleteService.createDeleteRequest(
                mockUserId, 
                true,  // deleteAccount
                false, // deleteVehicles
                true,  // deleteRoutes
                false, // deleteBookings
                true   // sendEmailCopy
            );

            expect(result).toEqual(mockResponse);
            expect(prisma.deletionrequest.create).toHaveBeenCalledWith({
                data: {
                    userId: mockUserId,
                    deleteAccount: true,
                    deleteVehicles: false,
                    deleteRoutes: true,
                    deleteBookings: false,
                    sendEmailCopy: true,
                }
            });
        });
    });

    describe('getDeleteRequestByUserId()', () => {
        it('should call prisma.deletionrequest.findFirst with correct userId', async () => {
            const mockData = { id: 1, userId: mockUserId };
            prisma.deletionrequest.findFirst.mockResolvedValue(mockData);

            const result = await DeleteService.getDeleteRequestByUserId(mockUserId);

            expect(result).toEqual(mockData);
            expect(prisma.deletionrequest.findFirst).toHaveBeenCalledWith({
                where: { userId: mockUserId }
            });
        });

        it('should throw ApiError 404 when delete request is not found (Failure)', async () => {
        prisma.deletionrequest.findFirst.mockResolvedValue(null);

        await expect(DeleteService.getDeleteRequestByUserId(mockUserId))
            .rejects
            .toThrow('Delete request not found');

        try {
            await DeleteService.getDeleteRequestByUserId(mockUserId);
        } catch (error) {
            expect(error.statusCode).toBe(404);
            expect(error.message).toBe('Delete request not found');
        }
        });
    });

    describe('markDeleteUserData()', () => {
        it('should update user isDeleted field based on deleteAccount in request', async () => {
            const mockDeleteRequest = { deleteAccount: true };
            prisma.user.update.mockResolvedValue({ id: mockUserId, isDeleted: true });

            await DeleteService.markDeleteUserData(mockUserId, mockDeleteRequest);

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: mockUserId },
                data: { isDeleted: true }
            });
        });
    });

    describe('markDeleteVehicles()', () => {
        it('should update vehicle isDeleted field based on deleteVehicles in request', async () => {
            const mockDeleteRequest = { deleteVehicles: true };
            prisma.vehicle.updateMany.mockResolvedValue({ count: 2 });

            const result = await DeleteService.markDeleteVehicles(mockUserId, mockDeleteRequest);

            expect(result.count).toBe(2);
            expect(prisma.vehicle.updateMany).toHaveBeenCalledWith({
                where: { ownerId: mockUserId },
                data: { isDeleted: true }
            });
        });
    });

    describe('markDeleteRoutes()', () => {
        it('should update route isDeleted field based on deleteRoutes in request', async () => {
            const mockDeleteRequest = { deleteRoutes: true };
            prisma.route.updateMany.mockResolvedValue({ count: 5 });

            await DeleteService.markDeleteRoutes(mockUserId, mockDeleteRequest);

            expect(prisma.route.updateMany).toHaveBeenCalledWith({
                where: { driverId: mockUserId },
                data: { isDeleted: true }
            });
        });
    });

    describe('markDeleteBookings()', () => {
        it('should update booking isDeleted field based on deleteBookings in request', async () => {
            const mockDeleteRequest = { deleteBookings: true };
            prisma.booking.updateMany.mockResolvedValue({ count: 1 });

            await DeleteService.markDeleteBookings(mockUserId, mockDeleteRequest);

            expect(prisma.booking.updateMany).toHaveBeenCalledWith({
                where: { userId: mockUserId },
                data: { isDeleted: true }
            });
        });
    });
});