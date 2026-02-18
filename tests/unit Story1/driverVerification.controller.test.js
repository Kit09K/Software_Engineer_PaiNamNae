const verifController = require('../../backend/src/controllers/driverVerification.controller');
const verifService = require('../../backend/src/services/driverVerification.service');
const notifService = require('../../backend/src/services/notification.service');
const { uploadToCloudinary } = require('../../backend/src/utils/cloudinary');
const prisma = require('../../backend/src/lib/prisma');
const ApiError = require('../../backend/src/utils/ApiError');

jest.mock('../../backend/src/services/driverVerification.service');
jest.mock('../../backend/src/services/notification.service');
jest.mock('../../backend/src/utils/cloudinary');
jest.mock('../../backend/src/lib/prisma', () => ({
  systemLog: {
    create: jest.fn(),
  },
}));

const mockRequest = (body = {}, user = {}, params = {}, query = {}, files = {}, file = null) => ({
  body,
  user,
  params,
  query,
  files,
  file,
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

describe('Verification Controller Unit Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createVerification', () => {
    it('should create verification with file uploads and log activity', async () => {
      const req = mockRequest(
        {
          licenseNumber: '12345',
          licenseIssueDate: '2023-01-01',
          licenseExpiryDate: '2028-01-01'
        },
        { sub: 1 },
        {},
        {},
        {
          licensePhotoUrl: [{ buffer: Buffer.from('lic') }],
          selfiePhotoUrl: [{ buffer: Buffer.from('self') }]
        }
      );
      const res = mockResponse();

      uploadToCloudinary.mockResolvedValue({ url: 'http://mock.url/img.jpg' });
      const mockNewRec = { id: 10, userId: 1, status: 'PENDING' };
      verifService.createVerification.mockResolvedValue(mockNewRec);

      await verifController.createVerification(req, res, mockNext);

      expect(uploadToCloudinary).toHaveBeenCalledTimes(2);
      expect(verifService.createVerification).toHaveBeenCalled();
      expect(prisma.systemLog.create).toHaveBeenCalled();
      expect(notifService.createNotificationByAdmin).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should throw 400 if files are missing', async () => {
      const req = mockRequest({}, { sub: 1 });
      const res = mockResponse();

      await verifController.createVerification(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });
  });

  describe('getMyVerification', () => {
    it('should return verification for logged in user', async () => {
      const req = mockRequest({}, { sub: 1 });
      const res = mockResponse();
      verifService.getVerificationByUser.mockResolvedValue({ id: 10 });

      await verifController.getMyVerification(req, res, mockNext);

      expect(verifService.getVerificationByUser).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateVerification', () => {
    it('should update verification if user owns it', async () => {
      const req = mockRequest({ firstNameOnLicense: 'Updated' }, { sub: 1 }, { id: 10 });
      const res = mockResponse();

      verifService.getVerificationById.mockResolvedValue({ id: 10, userId: 1 });
      verifService.updateVerification.mockResolvedValue({ id: 10, firstNameOnLicense: 'Updated' });

      await verifController.updateVerification(req, res, mockNext);

      expect(verifService.updateVerification).toHaveBeenCalled();
      expect(notifService.createNotificationByAdmin).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should throw 403 if user does not own verification', async () => {
      const req = mockRequest({}, { sub: 2 }, { id: 10 });
      const res = mockResponse();

      verifService.getVerificationById.mockResolvedValue({ id: 10, userId: 1 });

      await verifController.updateVerification(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(403);
    });
  });

  describe('updateVerificationStatus', () => {
    it('should update status to APPROVED and send notification', async () => {
      const req = mockRequest({ status: 'APPROVED' }, {}, { id: 10 });
      const res = mockResponse();

      const mockUpdated = { id: 10, userId: 1, status: 'APPROVED' };
      verifService.updateVerificationStatus.mockResolvedValue(mockUpdated);

      await verifController.updateVerificationStatus(req, res, mockNext);

      expect(verifService.updateVerificationStatus).toHaveBeenCalledWith(10, 'APPROVED');
      expect(notifService.createNotificationByAdmin).toHaveBeenCalledWith(expect.objectContaining({
        title: 'ยืนยันตัวตนคนขับสำเร็จ'
      }));
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should update status to REJECTED and send notification', async () => {
      const req = mockRequest({ status: 'REJECTED' }, {}, { id: 10 });
      const res = mockResponse();

      const mockUpdated = { id: 10, userId: 1, status: 'REJECTED' };
      verifService.updateVerificationStatus.mockResolvedValue(mockUpdated);

      await verifController.updateVerificationStatus(req, res, mockNext);

      expect(notifService.createNotificationByAdmin).toHaveBeenCalledWith(expect.objectContaining({
        title: 'คำขอคนขับถูกปฏิเสธ'
      }));
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('adminListVerifications', () => {
    it('should list verifications with query params', async () => {
      const req = mockRequest({}, {}, {}, { page: 1 });
      const res = mockResponse();

      verifService.searchVerifications.mockResolvedValue({ data: [] });

      await verifController.adminListVerifications(req, res, mockNext);

      expect(verifService.searchVerifications).toHaveBeenCalledWith({ page: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('adminCreateVerification', () => {
    it('should create verification by admin with optional files', async () => {
      const req = mockRequest(
        { licenseNumber: 'A1' },
        {},
        {},
        {},
        { licensePhotoUrl: [{ buffer: Buffer.from('img') }] }
      );
      const res = mockResponse();

      uploadToCloudinary.mockResolvedValue({ url: 'img-url' });
      verifService.createVerificationByAdmin.mockResolvedValue({ id: 1 });

      await verifController.adminCreateVerification(req, res, mockNext);

      expect(uploadToCloudinary).toHaveBeenCalled();
      expect(verifService.createVerificationByAdmin).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('adminDeleteVerification', () => {
    it('should delete verification if found', async () => {
      const req = mockRequest({}, {}, { id: 1 });
      const res = mockResponse();

      verifService.getVerificationById.mockResolvedValue({ id: 1 });
      verifService.deleteVerificationByAdmin.mockResolvedValue();

      await verifController.adminDeleteVerification(req, res, mockNext);

      expect(verifService.deleteVerificationByAdmin).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should throw 404 if verification not found', async () => {
      const req = mockRequest({}, {}, { id: 99 });
      const res = mockResponse();

      verifService.getVerificationById.mockResolvedValue(null);

      await verifController.adminDeleteVerification(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  describe('adminUpdateVerification', () => {
    it('should update verification by admin', async () => {
      const req = mockRequest({ licenseNumber: 'B2' }, {}, { id: 1 });
      const res = mockResponse();

      verifService.getVerificationById.mockResolvedValue({ id: 1 });
      verifService.updateVerificationByAdmin.mockResolvedValue({ id: 1, licenseNumber: 'B2' });

      await verifController.adminUpdateVerification(req, res, mockNext);

      expect(verifService.updateVerificationByAdmin).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getVerificationById', () => {
    it('should return verification by id', async () => {
      const req = mockRequest({}, {}, { id: 1 });
      const res = mockResponse();
      verifService.getVerificationById.mockResolvedValue({ id: 1 });

      await verifController.getVerificationById(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should throw 404 if not found', async () => {
      const req = mockRequest({}, {}, { id: 99 });
      const res = mockResponse();
      verifService.getVerificationById.mockResolvedValue(null);

      await verifController.getVerificationById(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  describe('getAllVerifications', () => {
    it('should return all verifications', async () => {
      const req = mockRequest();
      const res = mockResponse();
      verifService.getAllVerifications.mockResolvedValue([]);

      await verifController.getAllVerifications(req, res, mockNext);

      expect(verifService.getAllVerifications).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});