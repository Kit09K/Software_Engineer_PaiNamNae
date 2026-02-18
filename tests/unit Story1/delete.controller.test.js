const DeleteController = require('../../backend/src/controllers/delete.controller');
const DeleteService = require('../../backend/src/services/delete.service');
const VehicleService = require('../../backend/src/services/vehicle.service');
const RouteService = require('../../backend/src/services/route.service');
const BookingService = require('../../backend/src/services/booking.service');
const UserService = require('../../backend/src/services/user.service');
const EmailService = require('../../backend/src/services/email.service');
const prisma = require('../../backend/src/lib/prisma');
const ApiError = require('../../backend/src/utils/ApiError');

jest.mock('../../backend/src/services/delete.service');
jest.mock('../../backend/src/services/vehicle.service');
jest.mock('../../backend/src/services/route.service');
jest.mock('../../backend/src/services/booking.service');
jest.mock('../../backend/src/services/user.service');
jest.mock('../../backend/src/services/email.service');
jest.mock('../../backend/src/lib/prisma', () => ({
  systemLog: {
    create: jest.fn(),
  },
}));


const mockRequest = (body = {}, user = {}) => ({
  body,
  user,
  ip: '127.0.0.1',
  headers: { 'user-agent': 'jest-test' },
  connection: { remoteAddress: '127.0.0.1' }
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Delete Controller Unit Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('softDeleteUser', () => {

    it('should create delete request, process background tasks, and send email', async () => {
      const req = mockRequest({
        deleteAccount: true,
        deleteVehicles: true,
        deleteRoutes: true,
        deleteBookings: true,
        sendEmailCopy: true
      }, { 
        id: 1, 
        email: 'test@example.com', 
        role: 'DRIVER'
      });
      const res = mockResponse();

      DeleteService.createDeleteRequest.mockResolvedValue({ id: 99 });
 
      DeleteService.getDeleteRequestByUserId.mockResolvedValue(req.body);
      UserService.getUserById.mockResolvedValue({ id: 1, name: 'User' });
      VehicleService.getAllVehicles.mockResolvedValue([{ id: 1, plate: 'ABC' }]);
      RouteService.getMyRoutes.mockResolvedValue([{ id: 1, name: 'Route1' }]);
      BookingService.getMyBookings.mockResolvedValue([{ id: 1, status: 'PENDING' }]);

      await DeleteController.softDeleteUser(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Delete request created successfully",
      });

      expect(DeleteService.createDeleteRequest).toHaveBeenCalled();

      expect(UserService.getUserById).toHaveBeenCalledWith(1);
      expect(VehicleService.getAllVehicles).toHaveBeenCalledWith(1);
      expect(RouteService.getMyRoutes).toHaveBeenCalledWith(1);
      expect(BookingService.getMyBookings).toHaveBeenCalledWith(1);

      expect(DeleteService.markDeleteUserData).toHaveBeenCalledWith(1);
      expect(DeleteService.markDeleteVehicles).toHaveBeenCalledWith(1);
      expect(DeleteService.markDeleteRoutes).toHaveBeenCalledWith(1);
      expect(DeleteService.markDeleteBookings).toHaveBeenCalledWith(1);

      expect(prisma.systemLog.create).toHaveBeenCalled();

      expect(EmailService.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
        to: 'test@example.com',
        subject: "Your Account Deletion Request Has Been Processed"
      }));
    });

    it('should not delete routes if user is not a DRIVER', async () => {
      const req = mockRequest({
        deleteRoutes: true 
      }, { 
        id: 2, 
        email: 'passenger@example.com', 
        role: 'PASSENGER' 
      });
      const res = mockResponse();

      DeleteService.createDeleteRequest.mockResolvedValue({});
      DeleteService.getDeleteRequestByUserId.mockResolvedValue({ deleteRoutes: true });

      await DeleteController.softDeleteUser(req, res, mockNext);

      expect(RouteService.getMyRoutes).not.toHaveBeenCalled();
      expect(DeleteService.markDeleteRoutes).not.toHaveBeenCalled();
 
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should throw 401 if user ID is missing', async () => {
      const req = mockRequest({}, {});
      const res = mockResponse();

      await DeleteController.softDeleteUser(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
      expect(mockNext.mock.calls[0][0].message).toBe("User not authenticated");
    });

    it('should handle errors in background tasks gracefully (log only)', async () => {
      const req = mockRequest({ sendEmailCopy: true }, { id: 1, email: 'test@test.com' });
      const res = mockResponse();

      DeleteService.createDeleteRequest.mockResolvedValue({});
      DeleteService.getDeleteRequestByUserId.mockResolvedValue({ sendEmailCopy: true });

      EmailService.sendEmail.mockRejectedValue(new Error("Email server down"));
  
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await DeleteController.softDeleteUser(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

  });
});