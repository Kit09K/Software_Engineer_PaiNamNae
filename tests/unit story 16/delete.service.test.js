const prisma = require('../../backend/src/utils/prisma');
const DeleteService = require('../../backend/src/services/delete.service.js');

jest.mock('../../backend/src/utils/prisma', () => ({
    deletionRequest: {
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

describe('DeleteService.createDeleteRequest', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });


    it('should create deletion request with correct data', async () => {
        prisma.deletionRequest.create.mockResolvedValue({
            id: '123',
            status: 'PENDING'
        });

        const result = await DeleteService.createDeleteRequest(
            'user-1',
            true,
            false,
            false,
            false,
            true
        );

        expect(prisma.deletionRequest.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
            userId: 'user-1',
            deleteAccount: true,
            sendEmailCopy: true,
            status: 'PENDING'
            })
        });

        expect(result.status).toBe('PENDING');
    });


    it('should return delete request if found', async () => {
        prisma.deletionRequest.findFirst.mockResolvedValue({
            id: 'req-1',
            userId: 'user-1'
        });

        const result = await DeleteService.getDeleteRequestByUserId('user-1');

        expect(result.id).toBe('req-1');
    });


    it('should throw ApiError if delete request not found', async () => {
        prisma.deletionRequest.findFirst.mockResolvedValue(null);

        await expect(
            DeleteService.getDeleteRequestByUserId('user-1')
        ).rejects.toThrow('Delete request not found');
    });


    it('should update user isDeleted correctly', async () => {
        prisma.user.update.mockResolvedValue({
            id: 'user-1',
            isDeleted: true
        });

        const deleteRequest = { deleteAccount: true };

        const result = await DeleteService.markDeleteUserData(
            'user-1',
            deleteRequest
        );

        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 'user-1' },
            data: expect.objectContaining({
            isDeleted: true
            })
        });

        expect(result.isDeleted).toBe(true);
    });


    it('should update vehicles isDeleted flag', async () => {

        prisma.vehicle.updateMany.mockResolvedValue({ count: 2 });

        const deleteRequest = { deleteVehicles: true };

        const result = await DeleteService.markDeleteVehicles(
            'user-1',
            deleteRequest
        );

        expect(prisma.vehicle.updateMany).toHaveBeenCalledWith({
            where: { ownerId: 'user-1' },
            data: { isDeleted: true }
        });

        expect(result.count).toBe(2);
    });


    it('should cancel routes correctly', async () => {

        prisma.route.updateMany.mockResolvedValue({ count: 3 });

        const deleteRequest = { deleteRoutes: true };

        const result = await DeleteService.markDeleteRoutes(
            'user-1',
            deleteRequest
        );

        expect(prisma.route.updateMany).toHaveBeenCalledWith({
            where: { driverId: 'user-1' },
            data: { isCancelled: true }
        });

    });


    it('should anonymize bookings correctly', async () => {

        prisma.booking.updateMany.mockResolvedValue({ count: 4 });

        const deleteRequest = { deleteBookings: true };

        const result = await DeleteService.markDeleteBookings(
            'user-1',
            deleteRequest
        );

        expect(prisma.booking.updateMany).toHaveBeenCalledWith({
            where: { userId: 'user-1' },
            data: { isAnonymized: true }
        });

    });

});
