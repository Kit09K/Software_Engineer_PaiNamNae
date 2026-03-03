const cron = require('node-cron');
const systemLogService = require('../services/systemLog.service');

// ตั้งเวลาให้รันทุกวันตอนเที่ยงคืน (00:00)
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily log cleanup...');
    try {
        // สั่งลบ Log ที่อายุเกิน 90 วัน
        const result = await systemLogService.deleteLogsOlderThan(90);
        
        // บันทึกว่าระบบได้ทำการลบข้อมูลเก่าสำเร็จ (Audit Trail)
        await systemLogService.createLog({
            action: 'DELETE_DATA',
            level: 'INFO',
            resource: 'SystemLog_Cron',
            ipAddress: '127.0.0.1', 
            userAgent: 'Node-Cron',
            details: { message: 'Auto-deleted old logs', deletedCount: result.count }
        });

        console.log(`Successfully deleted ${result.count} old logs.`);
    } catch (error) {
        console.error('Error during daily log cleanup:', error);
    }
});