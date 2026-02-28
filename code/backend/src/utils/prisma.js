const { PrismaClient } = require('@prisma/client');

function withSoftDelete(baseClient) {
    return baseClient.$extends({
        // ทำการ override method ต่าง ๆ ของ Prisma Client เพื่อเพิ่มเงื่อนไข isDeleted: false ในทุก ๆ query ที่เกี่ยวข้องกับ User, Vehicle, Route และ Booking
        query : {
            user : {
                async findMany({args, query}) {
                    if (args.where?.isDeleted === undefined) {
                        args.where = {
                        ...args.where,
                        isDeleted: false
                        }
                    }
                    return query(args);
                },
                async findFirst({args, query}) {
                    if (args.where?.isDeleted === undefined) {
                        args.where = {
                        ...args.where,
                        isDeleted: false
                        }
                    }
                    return query(args);
                },
                async findUnique({args, query}) {
                    if (args.where?.isDeleted === undefined) {
                        args.where = {
                        ...args.where,
                        isDeleted: false
                        }
                    }
                    return query(args);
                },
                async count ({args, query}) {
                    if (args.where?.isDeleted === undefined) {
                        args.where = {
                        ...args.where,
                        isDeleted: false
                        }
                    } 
                    return query(args);
                }
            },
            vehicle : {
                async findMany({args, query}) {
                    if (args.where?.isDeleted === undefined) {
                        args.where = {
                        ...args.where,
                        isDeleted: false
                        }
                    }
                    return query(args);
                },
                async findFirst({args, query}) {
                    if (args.where?.isDeleted === undefined) {
                        args.where = {
                        ...args.where,
                        isDeleted: false
                        }
                    }
                    return query(args);
                },
                async findUnique({args, query}) {
                    if (args.where?.isDeleted === undefined) {
                        args.where = {
                        ...args.where,
                        isDeleted: false
                        }
                    }
                    return query(args);
                },
                async count ({args, query}) {
                    if (args.where?.isDeleted === undefined) {
                        args.where = {
                        ...args.where,
                        isDeleted: false
                        }
                    }
                    return query(args);
                }
            },
            route : {
                async findMany({args, query}) {
                    if (args.where?.isDeleted === undefined) {
                        args.where = {
                        ...args.where,
                        isDeleted: false
                        }
                    }
                    return query(args);
                },
                async findFirst({args, query}) {
                    if (args.where?.isDeleted === undefined) {
                        args.where = {
                        ...args.where,
                        isDeleted: false
                        }
                    }
                    return query(args);
                },
                async findUnique({args, query}) {
                    if (args.where?.isDeleted === undefined) {
                        args.where = {
                        ...args.where,
                        isDeleted: false
                        }
                    }
                    return query(args);
                },
                async count ({args, query}) {
                    if (args.where?.isDeleted === undefined) {
                        args.where = {
                        ...args.where,
                        isDeleted: false
                        }
                    }
                    return query(args);
                }
            },
            booking : {
                async findMany({args, query}) {
                    if (args.where?.isDeleted === undefined) {
                        args.where = {
                        ...args.where,
                        isDeleted: false
                        }
                    }
                    return query(args);
                },
                async findFirst({args, query}) {
                    if (args.where?.isDeleted === undefined) {
                        args.where = {
                        ...args.where,
                        isDeleted: false
                        }
                    }
                    return query(args);
                },
                async findUnique({args, query}) {
                    if (args.where?.isDeleted === undefined) {
                        args.where = {
                        ...args.where,
                        isDeleted: false
                        }
                    }
                    return query(args);
                },
                async count ({args, query}) {
                    if (args.where?.isDeleted === undefined) {
                        args.where = {
                        ...args.where,
                        isDeleted: false
                        }
                    }
                    return query(args);
                }
            },
        }
    });
}

let prisma;

if (process.env.NODE_ENV === 'production') {
    const basePrisma = new PrismaClient();
    prisma = withSoftDelete(basePrisma);
} else {
    if (!global.prisma) {
        const basePrisma = new PrismaClient();
        global.prisma = withSoftDelete(basePrisma);
    }
    prisma = global.prisma;
}

module.exports = prisma;