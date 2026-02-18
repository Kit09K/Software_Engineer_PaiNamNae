const bookingController = require('../../backend/src/controllers/booking.controller');
const bookingService = require('../../backend/src/services/booking.service');
const prisma = require('../../backend/src/lib/prisma');
const ApiError = require('../../backend/src/utils/ApiError');

jest.mock('../../backend/src/services/booking.service');
jest.mock('../../backend/src/lib/prisma', () => ({
  systemLog: {
    create: jest.fn(),
  },
}));

const mockRequest = (body = {}, user = {}, params = {}, query = {}) => ({
  body,
  user,
  params,
  query,
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

describe('Booking Controller Unit Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    it('should create booking and log activity', async () => {
      const req = mockRequest(
        { routeId: 1, numberOfSeats: 2, pickupLocation: 'A', dropoffLocation: 'B' },
        { sub: 123 } 
      );
      const res = mockResponse();
      const mockBooking = { id: 10, status: 'PENDING' };

      bookingService.createBooking.mockResolvedValue(mockBooking);

      await bookingController.createBooking(req, res, mockNext);

      expect(bookingService.createBooking).toHaveBeenCalledWith(
        { routeId: 1, numberOfSeats: 2, pickupLocation: 'A', dropoffLocation: 'B' },
        123
      );
      expect(prisma.systemLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ action: 'CREATE_DATA', userId: 123 })
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockBooking });
    });
  });

  describe('getBookingById', () => {
    it('should return booking if user is the passenger', async () => {
      const req = mockRequest({}, { sub: 1 }, { id: 100 });
      const res = mockResponse();

      const mockBooking = { 
        id: 100, 
        passengerId: 1,
        route: { driverId: 99 } 
      };
      bookingService.getBookingById.mockResolvedValue(mockBooking);

      await bookingController.getBookingById(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockBooking });
    });

    it('should return booking if user is the driver', async () => {
      const req = mockRequest({}, { sub: 99 }, { id: 100 }); 
      const res = mockResponse();

      const mockBooking = { 
        id: 100, 
        passengerId: 1, 
        route: { driverId: 99 }
      };
      bookingService.getBookingById.mockResolvedValue(mockBooking);

      await bookingController.getBookingById(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should throw 403 Forbidden if user is unrelated', async () => {
      const req = mockRequest({}, { sub: 555 }, { id: 100 }); 
      const res = mockResponse();

      const mockBooking = { 
        id: 100, 
        passengerId: 1, 
        route: { driverId: 99 } 
      };
      bookingService.getBookingById.mockResolvedValue(mockBooking);

      await bookingController.getBookingById(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(403);
    });

    it('should throw 404 if booking not found', async () => {
      bookingService.getBookingById.mockResolvedValue(null);
      const req = mockRequest({}, { sub: 1 }, { id: 999 });

      await bookingController.getBookingById(req, mockResponse(), mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  describe('adminListBookings', () => {
    it('should return list of bookings', async () => {
      const req = mockRequest({}, {}, {}, { page: 1 });
      const res = mockResponse();
      const mockResult = { data: [], pagination: {} };

      bookingService.searchBookingsAdmin.mockResolvedValue(mockResult);

      await bookingController.adminListBookings(req, res, mockNext);

      expect(bookingService.searchBookingsAdmin).toHaveBeenCalledWith({ page: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateBookingStatus', () => {
    it('should update status and log activity', async () => {
      const req = mockRequest({ status: 'CONFIRMED' }, { sub: 2 }, { id: 10 });
      const res = mockResponse();
      
      bookingService.updateBookingStatus.mockResolvedValue({ id: 10, status: 'CONFIRMED' });

      await bookingController.updateBookingStatus(req, res, mockNext);

      expect(bookingService.updateBookingStatus).toHaveBeenCalledWith(10, 'CONFIRMED', 2);
      expect(prisma.systemLog.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('cancelBooking', () => {
    it('should cancel booking and log activity', async () => {
      const req = mockRequest({ reason: 'Changed mind' }, { sub: 1 }, { id: 10 });
      const res = mockResponse();

      bookingService.cancelBooking.mockResolvedValue({ id: 10, status: 'CANCELLED' });

      await bookingController.cancelBooking(req, res, mockNext);

      expect(bookingService.cancelBooking).toHaveBeenCalledWith(10, 1, { reason: 'Changed mind' });
      expect(prisma.systemLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ action: 'UPDATE_DATA', details: expect.objectContaining({ status: 'CANCELLED' }) })
      }));
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('adminCreateBooking', () => {
    it('should create booking by admin', async () => {
        const req = mockRequest({ routeId: 1 }, { sub: 99 });
        const res = mockResponse();
        bookingService.adminCreateBooking.mockResolvedValue({ id: 50 });

        await bookingController.adminCreateBooking(req, res, mockNext);

        expect(bookingService.adminCreateBooking).toHaveBeenCalled();
        expect(prisma.systemLog.create).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('adminDeleteBooking', () => {
      it('should delete booking by admin', async () => {
          const req = mockRequest({}, { sub: 99 }, { id: 50 });
          const res = mockResponse();
          bookingService.adminDeleteBooking.mockResolvedValue({ success: true });

          await bookingController.adminDeleteBooking(req, res, mockNext);

          expect(bookingService.adminDeleteBooking).toHaveBeenCalledWith(50);
          expect(prisma.systemLog.create).toHaveBeenCalled();
          expect(res.status).toHaveBeenCalledWith(200);
      });
  });

});