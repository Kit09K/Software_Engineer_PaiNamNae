const vehicleController = require('../../backend/src/controllers/vehicle.controller');
const vehicleService = require('../../backend/src/services/vehicle.service');
const userService = require('../../backend/src/services/user.service');
const { uploadToCloudinary } = require('../../backend/src/utils/cloudinary');
const prisma = require('../../backend/src/lib/prisma');
const ApiError = require('../../backend/src/utils/ApiError');


jest.mock('../../backend/src/services/vehicle.service');
jest.mock('../../backend/src/services/user.service');
jest.mock('../../backend/src/utils/cloudinary');
jest.mock('../../backend/src/lib/prisma', () => ({
  systemLog: {
    create: jest.fn(),
  },
}));

const mockRequest = (body = {}, user = {}, params = {}, query = {}, files = {}) => ({
  body,
  user,
  params,
  query,
  files,
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

describe('Vehicle Controller Unit Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // 1. Customer/Driver Tests
  // ==========================================

  describe('listMyVehicles', () => {
    it('should return list of vehicles owned by user', async () => {
      const req = mockRequest({}, { sub: 1 });
      const res = mockResponse();
      
      vehicleService.searchMyVehicles.mockResolvedValue({ data: [] });

      await vehicleController.listMyVehicles(req, res, mockNext);

      expect(vehicleService.searchMyVehicles).toHaveBeenCalledWith(1, {});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('getVehicleById', () => {
    it('should return vehicle if found', async () => {
      const req = mockRequest({}, { sub: 1 }, { id: 10 });
      const res = mockResponse();
      
      vehicleService.getVehicleById.mockResolvedValue({ id: 10, ownerId: 1 });

      await vehicleController.getVehicleById(req, res, mockNext);

      expect(vehicleService.getVehicleById).toHaveBeenCalledWith(10, 1);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should throw 404 if vehicle not found', async () => {
      const req = mockRequest({}, { sub: 1 }, { id: 99 });
      const res = mockResponse();

      vehicleService.getVehicleById.mockResolvedValue(null);

      await vehicleController.getVehicleById(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  describe('createVehicle', () => {
    it('should create vehicle with photos and log activity', async () => {
      const req = mockRequest(
        { licensePlate: 'ABC-123' }, 
        { sub: 1 }, 
        {}, {}, 
        { photos: [{ buffer: Buffer.from('img') }] } // Mock files
      );
      const res = mockResponse();

      uploadToCloudinary.mockResolvedValue({ url: 'http://cloud.url/img.jpg' });
      vehicleService.createVehicle.mockResolvedValue({ id: 5, licensePlate: 'ABC-123' });

      await vehicleController.createVehicle(req, res, mockNext);

      expect(uploadToCloudinary).toHaveBeenCalled();
      expect(vehicleService.createVehicle).toHaveBeenCalledWith(
        expect.objectContaining({ photos: ['http://cloud.url/img.jpg'] }),
        1
      );
      expect(prisma.systemLog.create).toHaveBeenCalled(); // Check logging
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateVehicle', () => {
    it('should update vehicle and log activity', async () => {
      const req = mockRequest({ model: 'New Model' }, { sub: 1 }, { id: 5 });
      const res = mockResponse();

      vehicleService.updateVehicle.mockResolvedValue({ id: 5, model: 'New Model' });

      await vehicleController.updateVehicle(req, res, mockNext);

      expect(vehicleService.updateVehicle).toHaveBeenCalledWith(5, 1, expect.objectContaining({ model: 'New Model' }));
      expect(prisma.systemLog.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteVehicle', () => {
    it('should delete vehicle and log activity', async () => {
      const req = mockRequest({}, { sub: 1 }, { id: 5 });
      const res = mockResponse();

      vehicleService.deleteVehicle.mockResolvedValue({ count: 1 });

      await vehicleController.deleteVehicle(req, res, mockNext);

      expect(vehicleService.deleteVehicle).toHaveBeenCalledWith(5, 1);
      expect(prisma.systemLog.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('setDefaultVehicle', () => {
    it('should set default vehicle', async () => {
      const req = mockRequest({}, { sub: 1 }, { id: 5 });
      const res = mockResponse();

      vehicleService.setDefaultVehicle.mockResolvedValue({ id: 5, isDefault: true });

      await vehicleController.setDefaultVehicle(req, res, mockNext);

      expect(vehicleService.setDefaultVehicle).toHaveBeenCalledWith(5, 1);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ==========================================
  // 2. Admin Tests
  // ==========================================

  describe('adminListVehicles', () => {
    it('should return all vehicles for admin', async () => {
      const req = mockRequest({}, {}, {}, { page: 1 });
      const res = mockResponse();

      vehicleService.searchVehiclesAdmin.mockResolvedValue({ data: [] });

      await vehicleController.adminListVehicles(req, res, mockNext);

      expect(vehicleService.searchVehiclesAdmin).toHaveBeenCalledWith({ page: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getVehicleByIdAdmin', () => {
    it('should return vehicle by id for admin', async () => {
      const req = mockRequest({}, {}, { id: 10 });
      const res = mockResponse();
      
      vehicleService.getVehicleByIdAdmin.mockResolvedValue({ id: 10 });

      await vehicleController.getVehicleByIdAdmin(req, res, mockNext);

      expect(vehicleService.getVehicleByIdAdmin).toHaveBeenCalledWith(10);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should throw 404 if vehicle not found (admin)', async () => {
      const req = mockRequest({}, {}, { id: 99 });
      const res = mockResponse();
      vehicleService.getVehicleByIdAdmin.mockResolvedValue(null);

      await vehicleController.getVehicleByIdAdmin(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  describe('adminCreateVehicle', () => {
    it('should create vehicle for user by admin', async () => {
      const req = mockRequest({ userId: 2, licensePlate: 'XYZ' }, { sub: 99 }); // sub 99 is admin
      const res = mockResponse();

      userService.getUserById.mockResolvedValue({ id: 2 }); // Mock valid user
      vehicleService.createVehicle.mockResolvedValue({ id: 20 });

      await vehicleController.adminCreateVehicle(req, res, mockNext);

      expect(userService.getUserById).toHaveBeenCalledWith(2);
      expect(vehicleService.createVehicle).toHaveBeenCalledWith(expect.anything(), 2);
      expect(prisma.systemLog.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('adminUpdateVehicle', () => {
    it('should update vehicle by admin', async () => {
      const req = mockRequest({ model: 'Admin Update' }, { sub: 99 }, { id: 20 });
      const res = mockResponse();

      vehicleService.updateVehicleByAdmin.mockResolvedValue({ id: 20 });

      await vehicleController.adminUpdateVehicle(req, res, mockNext);

      expect(vehicleService.updateVehicleByAdmin).toHaveBeenCalledWith(20, expect.anything());
      expect(prisma.systemLog.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('adminDeleteVehicle', () => {
    it('should delete vehicle by admin', async () => {
      const req = mockRequest({}, { sub: 99 }, { id: 20 });
      const res = mockResponse();

      vehicleService.deleteVehicleByAdmin.mockResolvedValue({ count: 1 });

      await vehicleController.adminDeleteVehicle(req, res, mockNext);

      expect(vehicleService.deleteVehicleByAdmin).toHaveBeenCalledWith(20);
      expect(prisma.systemLog.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

});