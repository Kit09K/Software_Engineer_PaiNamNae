const cron = require('node-cron');
const DeleteRequestService = require('../services/deleteRequest.service');
const CleanupService = require('../services/cleanup.service');

const deleteRequestService = new DeleteRequestService();
const cleanupService = new CleanupService(deleteRequestService);

function scheduleHardDelete() {
    cron.schedule('0 0 * * *', async () => {
        console.log('Running hard delete cron job at', new Date());
        try{
            await cleanupService.delete90DaysData();
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