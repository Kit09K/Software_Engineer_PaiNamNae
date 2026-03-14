const DeleteRequestService = require('../../code/backend/src/services/deleteRequest.service.js');
const ApiError = require('../../code/backend/src/utils/ApiError');

jest.mock('../../code/backend/src/utils/prisma', () => ({
    deleteRequest: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn()
    },
    route: {
        findFirst: jest.fn()
    },
    booking: {
        findFirst: jest.fn()
    }
}));

jest.mock('../../code/backend/src/services/user.service', () => ({
    getUserById: jest.fn()
}));

jest.mock('../../code/backend/src/services/vehicle.service', () => ({
    getAllVehicles: jest.fn()
}));

jest.mock('../../code/backend/src/services/route.service', () => ({
    getMyRoutes: jest.fn()
}));

jest.mock('../../code/backend/src/services/booking.service', () => ({
    getMyBookings: jest.fn()
}));

const prisma = require('../../code/backend/src/utils/prisma');
const UserService = require('../../code/backend/src/services/user.service');
const VehicleService = require('../../code/backend/src/services/vehicle.service');
const RouteService = require('../../code/backend/src/services/route.service');
const BookingService = require('../../code/backend/src/services/booking.service');

describe('DeleteRequestService', () => {

    let deleteRequestService;
    let mockEmailService;
    let mockSoftDeleteService;

    beforeEach(() => {
        mockEmailService = {
            sendEmail: jest.fn()
        };

        mockSoftDeleteService = {
            softDeleteUser: jest.fn(),
            softDeleteVehicles: jest.fn(),
            softDeleteRoutes: jest.fn(),
            softDeleteBookings: jest.fn()
        };

        deleteRequestService = new DeleteRequestService(
            mockEmailService,
            mockSoftDeleteService
        );

        jest.clearAllMocks();
    });

    // ===============================
    // createDeleteRequest
    // ===============================
    describe('createDeleteRequest', () => {
        it('should create delete request successfully', async () => {
            prisma.deleteRequest.create.mockResolvedValue({ id: 1 });

            const result = await deleteRequestService.createDeleteRequest(
                1, true, false, false, false
            );

            expect(prisma.deleteRequest.create).toHaveBeenCalled();
            expect(result).toEqual({ id: 1 });
        });
    });

    // ===============================
    // getDeleteRequestByUserId
    // ===============================
    describe('getDeleteRequestByUserId', () => {
        it('should return delete request', async () => {
            prisma.deleteRequest.findFirst.mockResolvedValue({ id: 1 });

            const result = await deleteRequestService.getDeleteRequestByUserId(1);

            expect(result).toEqual({ id: 1 });
        });

        it('should throw 404 if not found', async () => {
            prisma.deleteRequest.findFirst.mockResolvedValue(null);

            await expect(
                deleteRequestService.getDeleteRequestByUserId(1)
            ).rejects.toThrow(ApiError);
        });
    });

    // ===============================
    // checkCanDeleteAccount
    // ===============================
    describe('checkCanDeleteAccount', () => {
        it('should return false if active route exists', async () => {
            prisma.route.findFirst.mockResolvedValue({ id: 99 });

            const result = await deleteRequestService.checkCanDeleteAccount(1);

            expect(result.canDelete).toBe(false);
            expect(result.reason).toBe("ACTIVE_ROUTE");
        });

        it('should return false if active booking exists', async () => {
            prisma.route.findFirst.mockResolvedValue(null);
            prisma.booking.findFirst.mockResolvedValue({ id: 10 });

            const result = await deleteRequestService.checkCanDeleteAccount(1);

            expect(result.canDelete).toBe(false);
            expect(result.reason).toBe("ACTIVE_BOOKING");
        });

        it('should return true if no active route or booking', async () => {
            prisma.route.findFirst.mockResolvedValue(null);
            prisma.booking.findFirst.mockResolvedValue(null);

            const result = await deleteRequestService.checkCanDeleteAccount(1);

            expect(result.canDelete).toBe(true);
        });
    });

    // ===============================
    // sendDeleteRequest
    // ===============================
    describe('sendDeleteRequest', () => {

        const mockUser = {
            id: 1,
            email: 'test@mail.com',
            firstName: 'John',
            lastName: 'Doe'
        };

        beforeEach(() => {
            prisma.route.findFirst.mockResolvedValue(null);
            prisma.booking.findFirst.mockResolvedValue(null);
            prisma.deleteRequest.create.mockResolvedValue({ id: 1 });

            UserService.getUserById.mockResolvedValue(mockUser);
            VehicleService.getAllVehicles.mockResolvedValue([]);
            RouteService.getMyRoutes.mockResolvedValue([]);
            BookingService.getMyBookings.mockResolvedValue([]);
        });

        it('should soft delete user and send email', async () => {

            await deleteRequestService.sendDeleteRequest({
                deleteUserRequest: true,
                deleteVehicleRequest: false,
                deleteRouteRequest: false,
                deleteBookingRequest: false
            }, 1);

            expect(mockSoftDeleteService.softDeleteUser).toHaveBeenCalledWith(1);
            expect(mockEmailService.sendEmail).toHaveBeenCalled();
        });

        it('should throw error if cannot delete account', async () => {
            prisma.route.findFirst.mockResolvedValue({ id: 5 });

            await expect(
                deleteRequestService.sendDeleteRequest({}, 1)
            ).rejects.toThrow(ApiError);
        });

    });

});