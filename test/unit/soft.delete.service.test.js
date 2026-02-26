const SoftDeleteService = require('../../code/backend/src/services/soft.delete.service');
const prisma = require('../../code/backend/src/utils/prisma');
const ApiError = require('../../code/backend/src/utils/ApiError');

jest.mock('../../code/backend/src/utils/prisma', () => ({
    deleteRequest: {
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

describe('SoftDeleteService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createDeleteRequest', () => {
        it('ควรสร้างคำขอลบข้อมูลได้อย่างถูกต้อง และตั้งค่า deleteAt เป็น 30 วันข้างหน้า', async () => {
            const mockUserId = 1;
            const mockResponse = { id: 1, userId: mockUserId };
            
            prisma.deleteRequest.create.mockResolvedValue(mockResponse);

            const result = await SoftDeleteService.createDeleteRequest(mockUserId, true, false, false, false);

            expect(result).toEqual(mockResponse);
            expect(prisma.deleteRequest.create).toHaveBeenCalledWith({
                data: {
                    userId: mockUserId,
                    deleteUserRequest: true,
                    deleteVehicleRequest: false,
                    deleteRouteRequest: false,
                    deleteBookingRequest: false,
                    requestAt: expect.any(Date),
                    deleteAt: expect.any(Date),
                }
            });
        });
    });

    describe('getDeleteRequestByUserId', () => {
        it('ควรคืนค่าคำขอลบข้อมูล หากพบข้อมูลในระบบ', async () => {
            const mockUserId = 1;
            const mockData = { id: 1, userId: mockUserId };
            
            prisma.deleteRequest.findFirst.mockResolvedValue(mockData);

            const result = await SoftDeleteService.getDeleteRequestByUserId(mockUserId);

            expect(result).toEqual(mockData);
            expect(prisma.deleteRequest.findFirst).toHaveBeenCalledWith({
                where: { userId: mockUserId }
            });
        });

        it('ควร throw ApiError (404) หากไม่พบคำขอลบข้อมูล', async () => {
            const mockUserId = 99;
            
            prisma.deleteRequest.findFirst.mockResolvedValue(null);

            await expect(SoftDeleteService.getDeleteRequestByUserId(mockUserId))
                .rejects
                .toThrow(new ApiError(404, 'Delete request not found'));
        });
    });

    describe('softDeleteUser', () => {
        it('ควรอัปเดตสถานะ isDeleted ของ User เป็น true', async () => {
            const mockUserId = 1;
            prisma.user.update.mockResolvedValue({ id: mockUserId, isDeleted: true });

            await SoftDeleteService.softDeleteUser(mockUserId);

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: mockUserId },
                data: { isDeleted: true }
            });
        });
    });

    describe('softDeleteVehicles', () => {
        it('ควรอัปเดตสถานะ isDeleted ของ Vehicle หลายรายการเป็น true', async () => {
            const mockUserId = 1;
            prisma.vehicle.updateMany.mockResolvedValue({ count: 2 });

            await SoftDeleteService.softDeleteVehicles(mockUserId);

            expect(prisma.vehicle.updateMany).toHaveBeenCalledWith({
                where: { userId: mockUserId },
                data: { isDeleted: true }
            });
        });
    });

    describe('softDeleteRoutes', () => {
        it('ควรอัปเดตสถานะ isDeleted ของ Route หลายรายการเป็น true', async () => {
            const mockUserId = 1;
            prisma.route.updateMany.mockResolvedValue({ count: 3 });

            await SoftDeleteService.softDeleteRoutes(mockUserId);

            expect(prisma.route.updateMany).toHaveBeenCalledWith({
                where: { driverId: mockUserId },
                data: { isDeleted: true }
            });
        });
    });

    describe('softDeleteBookings', () => {
        it('ควรอัปเดตสถานะ isDeleted ของ Booking หลายรายการเป็น true', async () => {
            const mockUserId = 1;
            prisma.booking.updateMany.mockResolvedValue({ count: 1 });

            await SoftDeleteService.softDeleteBookings(mockUserId);

            expect(prisma.booking.updateMany).toHaveBeenCalledWith({
                where: { passengerId: mockUserId },
                data: { isDeleted: true }
            });
        });
    });
});