const cron = require('node-cron');
const systemLogService = require('../services/systemLog.service');

// ตั้งเวลาให้รันทุกวันตอนเที่ยงคืน (00:00)
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily log cleanup...');
    await systemLogService.cleanupOldLogs();
});