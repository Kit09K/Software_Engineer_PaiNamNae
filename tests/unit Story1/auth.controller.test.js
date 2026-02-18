const authController = require('../../backend/src/controllers/auth.controller');
const userService = require('../../backend/src/services/user.service');
const { signToken } = require('../../backend/src/utils/jwt');
const prisma = require('../../backend/src/lib/prisma');
const ApiError = require('../../backend/src/utils/ApiError');


jest.mock('../../backend/src/services/user.service');
jest.mock('../../backend/src/utils/jwt');

jest.mock('../../backend/src/lib/prisma', () => ({
  systemLog: {
    create: jest.fn(),
  },
  user: {
    update: jest.fn(),
  },
}));

const mockRequest = (body = {}, user = {}, params = {}) => ({
  body,
  user,
  params,
  ip: '127.0.0.1',
  headers: { 'user-agent': 'jest-test-agent' },
  connection: { remoteAddress: '127.0.0.1' }
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res); 
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();


describe('Auth Controller Unit Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });


  describe('login', () => {
    it('should login successfully with email and return token', async () => {
      const req = mockRequest({ email: 'test@test.com', password: 'password123' });
      const res = mockResponse();

      const mockUser = {
        id: 1,
        email: 'test@test.com',
        role: 'USER',
        isActive: true,
        username: 'testuser',
        password: 'hashedPassword',
        createdAt: new Date(), 
        updatedAt: new Date()
      };

      userService.getUserByEmail.mockResolvedValue(mockUser);
      userService.comparePassword.mockResolvedValue(true);
      signToken.mockReturnValue('mock-jwt-token');

      await authController.login(req, res, mockNext);

      expect(userService.getUserByEmail).toHaveBeenCalledWith('test@test.com');
      expect(signToken).toHaveBeenCalled();

      expect(prisma.systemLog.create).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { lastLogin: expect.any(Date) }
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: "Login successful",
        data: expect.objectContaining({ token: 'mock-jwt-token' })
      }));
    });

    it('should throw 401 if account is inactive', async () => {
      const req = mockRequest({ email: 'inactive@test.com', password: 'password123' });
      const res = mockResponse();

      const mockUser = { id: 2, isActive: false };
      userService.getUserByEmail.mockResolvedValue(mockUser);

      await authController.login(req, res, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
      expect(mockNext.mock.calls[0][0].message).toBe("Your account has been deactivated.");
    });

    it('should throw 401 if password is invalid', async () => {
      const req = mockRequest({ email: 'test@test.com', password: 'wrong' });
      const res = mockResponse();
      const mockUser = { id: 1, isActive: true };

      userService.getUserByEmail.mockResolvedValue(mockUser);
      userService.comparePassword.mockResolvedValue(false);

      await authController.login(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      expect(mockNext.mock.calls[0][0].message).toBe("Invalid credentials");
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const req = mockRequest(
        { currentPassword: 'old', newPassword: 'new' }, 
        { sub: 123 } 
      );
      const res = mockResponse();

      userService.updatePassword.mockResolvedValue({ success: true });

      await authController.changePassword(req, res, mockNext);

      expect(userService.updatePassword).toHaveBeenCalledWith(123, 'old', 'new');
      expect(prisma.systemLog.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Password changed successfully"
      }));
    });

    it('should throw error if current password is incorrect', async () => {
      const req = mockRequest({ currentPassword: 'wrong', newPassword: 'new' }, { sub: 123 });
      const res = mockResponse();

      userService.updatePassword.mockResolvedValue({ success: false, error: 'INCORRECT_PASSWORD' });

      await authController.changePassword(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      expect(mockNext.mock.calls[0][0].message).toBe('Incorrect current password.');
    });
  });

  describe('updateMe', () => {
    it('should update user profile successfully', async () => {
      const req = mockRequest({ phoneNumber: '0999999999' }, { sub: 1 });
      const res = mockResponse();
      const mockUpdatedUser = { id: 1, phoneNumber: '0999999999' };

      userService.updateUserById.mockResolvedValue(mockUpdatedUser);

      await authController.updateMe(req, res, mockNext);

      expect(userService.updateUserById).toHaveBeenCalledWith(1, { phoneNumber: '0999999999' });
      expect(prisma.systemLog.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedUser
      });
    });
  });

  describe('logout', () => {
    it('should logout and log activity', async () => {
      const req = mockRequest({}, { sub: 55 });
      const res = mockResponse();

      await authController.logout(req, res, mockNext);

      expect(prisma.systemLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          action: 'LOGOUT',
          userId: 55
        })
      }));

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Logged out successfully"
      });
    });
  });

});