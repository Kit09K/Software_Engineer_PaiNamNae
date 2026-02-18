const prisma = require('../lib/prisma'); 
const { Parser } = require('json2csv');

const buildWhereClause = (query) => {
    const { search, action, date } = query;
    const where = {};

    if (action && action.trim() !== '') {
        where.action = action;
    }
    
    if (date && date.trim() !== '' && !isNaN(new Date(date).getTime())) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        where.timestamp = { gte: startDate, lt: endDate };
    }

    if (search && search.trim() !== '') {
        where.OR = [
            { ipAddress: { contains: search, mode: 'insensitive' } },
            { targetId: { contains: search, mode: 'insensitive' } },
            { user: { username: { contains: search, mode: 'insensitive' } } }
        ];
    }
    return where;
};

exports.getSystemLogs = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const where = buildWhereClause(req.query);

        const [logs, total] = await prisma.$transaction([
            prisma.systemLog.findMany({
                where,
                include: { user: { select: { username: true, role: true } } },
                orderBy: { timestamp: 'desc' },
                skip: parseInt(skip),
                take: parseInt(limit),
            }),
            prisma.systemLog.count({ where })
        ]);

        res.json({
            status: 'success',
            data: logs,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error("Get Logs Error:", error);
        next(error);
    }
};

exports.exportSystemLogs = async (req, res, next) => {
    try {
        const where = buildWhereClause(req.query);
        
        const logs = await prisma.systemLog.findMany({ 
            where, 
            include: { user: { select: { username: true } } },
            orderBy: { timestamp: 'desc' }
        });

        const simplifiedLogs = logs.map(log => ({
            timestamp: log.timestamp.toISOString(),
            username: log.user?.username || 'System',
            ipAddress: log.ipAddress,
            action: log.action,
            targetTable: log.targetTable || '',
            details: JSON.stringify(log.details)
        }));

        const fields = ['timestamp', 'username', 'ipAddress', 'action', 'targetTable', 'details'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(simplifiedLogs);

        res.header('Content-Type', 'text/csv');
        res.attachment(`system_logs_${new Date().toISOString()}.csv`);
        return res.send(csv);
    } catch (error) {
        next(error);
    }
};