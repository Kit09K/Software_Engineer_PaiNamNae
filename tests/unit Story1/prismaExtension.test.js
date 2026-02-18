const { getContext } = require('../../backend/src/utils/context');

jest.mock('../../backend/src/utils/context', () => ({
   getContext: jest.fn()
}));

const { PrismaClient } = require('@prisma/client');
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    $extends: jest.fn().mockReturnThis(),
    systemLog: { create: jest.fn() },
    $allOperations: jest.fn() 
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

describe('Prisma Auto-Logging Extension Logic', () => {
  let prisma;
  let prismaOriginal;

  beforeAll(() => {
    jest.isolateModules(() => {
        prisma = require('../../backend/src/lib/prisma');
    });
  });

  it('should attempt to register extensions', () => {
     expect(prisma).toBeDefined();
  });
});