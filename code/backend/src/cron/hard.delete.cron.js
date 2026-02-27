const cron = require('node-cron');
const CleanupService = require('../services/cleanup.service.js');


function scheduleHardDelete() {
    cron.schedule('0 0 * * *', async () => {
        console.log('Running hard delete cron job at', new Date());
        try{
            await CleanupService.delete90DaysData();
            console.log('Hard delete cron job completed successfully at', new Date());
        }
        catch (error) {
            console.error('Error running hard delete cron job:', error);
        }
    },{
        scheduled: true,
        timezone: 'Asia/Bangkok'
    });
    console.log('Hard delete cron job scheduled to run daily at midnight (Asia/Bangkok timezone).');
}

module.exports = scheduleHardDelete;