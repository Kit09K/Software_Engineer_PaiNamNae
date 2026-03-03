const SystemLogService = require('../../code/backend/src/services/systemLog.service.js');
const prisma = require('../../code/backend/src/utils/prisma');
const {
  createLog,
  queryLogs,
  getLogById,
  exportLogsToJSON,
  deleteLogsOlderThan,
} = require('../../code/backend/src/services/systemLog.service');

jest.mock('../../code/backend/src/utils/prisma', () => ({
    systemLog: {
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
  },
}));

describe('System Log Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLog', () => {
    it('should create a log with provided data and apply default values', async () => {
      const mockLogData = {
        userId: 1,
        action: 'LOGIN',
        ipAddress: '127.0.0.1',
      };

      const expectedCreatedLog = { id: 10, ...mockLogData, level: 'INFO' };
      prisma.systemLog.create.mockResolvedValue(expectedCreatedLog);

      const result = await createLog(mockLogData);

      expect(prisma.systemLog.create).toHaveBeenCalledTimes(1);
      expect(prisma.systemLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 1,
          action: 'LOGIN',
          level: 'INFO', 
          resource: 'System', 
          status: 'SUCCESS', 
          protocol: 'HTTP/1.1', 
        }),
      });
      expect(result).toEqual(expectedCreatedLog);
    });
  });

  describe('queryLogs', () => {
    it('should return paginated logs based on filter and options', async () => {
      const filter = { action: 'LOGIN', search: 'admin' };
      const options = { page: 2, limit: 10 };

      const mockLogs = [{ id: 1, action: 'LOGIN' }, { id: 2, action: 'LOGIN' }];
      
      prisma.systemLog.count.mockResolvedValue(25);
      prisma.systemLog.findMany.mockResolvedValue(mockLogs);

      const result = await queryLogs(filter, options);

      expect(prisma.systemLog.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ action: 'LOGIN' }),
        })
      );

      expect(prisma.systemLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 10, 
          orderBy: { timestamp: 'desc' },
        })
      );

      expect(result).toEqual({
        results: mockLogs,
        page: 2,
        limit: 10,
        totalPages: 3,
        totalResults: 25,
      });
    });
  });

  describe('getLogById', () => {
    it('should fetch a single log by its ID', async () => {
      const mockLog = { id: 99, action: 'UPDATE' };
      prisma.systemLog.findUnique.mockResolvedValue(mockLog);

      const result = await getLogById(99);

      expect(prisma.systemLog.findUnique).toHaveBeenCalledWith({
        where: { id: 99 },
        include: { user: expect.any(Object) },
      });
      expect(result).toEqual(mockLog);
    });
  });

  describe('exportLogsToJSON', () => {
    it('should generate a JSON payload and its SHA256 hash', async () => {
      const filter = { level: 'ERROR' };
      const mockLogs = [
        { id: 1, level: 'ERROR', timestamp: '2026-01-01T00:00:00.000Z' },
      ];

      prisma.systemLog.findMany.mockResolvedValue(mockLogs);

      const result = await exportLogsToJSON(filter);

      expect(prisma.systemLog.findMany).toHaveBeenCalledTimes(1);
      
      expect(result).toHaveProperty('fileContent');
      expect(result).toHaveProperty('fileHash');

      const parsedContent = JSON.parse(result.fileContent);
      expect(parsedContent).toHaveProperty('metadata');
      expect(parsedContent).toHaveProperty('data', mockLogs);
      expect(parsedContent.metadata.recordCount).toBe(1);
      expect(parsedContent.metadata.filtersApplied).toEqual(filter);

      expect(typeof result.fileHash).toBe('string');
      expect(result.fileHash).toHaveLength(64);
    });
  });

  describe('deleteLogsOlderThan', () => {
    it('should delete logs older than the specified number of days', async () => {
      prisma.systemLog.deleteMany.mockResolvedValue({ count: 15 });

      const days = 30;
      const result = await deleteLogsOlderThan(days);

      expect(prisma.systemLog.deleteMany).toHaveBeenCalledTimes(1);
      
      const callArgs = prisma.systemLog.deleteMany.mock.calls[0][0];
      expect(callArgs.where.timestamp).toHaveProperty('lt');
      expect(callArgs.where.timestamp.lt).toBeInstanceOf(Date);

      expect(result).toEqual({ count: 15 });
    });
  });
});

