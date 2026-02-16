const cron = require('node-cron');
const prisma = require('./prisma');
async function hardDeleteProcess() {
    console.log('Running hard delete task at', new Date());

    // Find all deletion requests that are pending and have reached their completion time
    try {
        const deletionRequests = await prisma.deletionRequest.findMany({
            where: {
                status: 'PENDING',
                completedAt: {
                    lte: new Date(),
                },
            },
        });

        // If no requests to process, log and exit
        if (deletionRequests.length === 0) {
            console.log('No pending deletion requests to process');
            return;
        }

        // Process each deletion request
        for (const request of deletionRequests) {
            console.log(`Processing deletion request for userId: ${request.userId}`);
            try {
                // Perform hard delete operations within a transaction for data integrity
                await prisma.$transaction(async (tx) => {

                    // Update the deletion request status to COMPLETED after all deletions are done
                    await tx.deletionRequest.update({
                        where: { id: request.id },
                        data: { status: 'COMPLETED' },
                    });
                    
                    // if the request is to delete the vehicles, delete all associated vehicle records
                    if (request.deleteVehicles) {
                        await tx.vehicle.deleteMany({
                            where: { userId: request.userId, isDeleted: true },
                        });
                    }
                    // if the request is to delete the routes, delete all associated route records
                    if (request.deleteRoutes) {
                        await tx.route.deleteMany({
                            where: { userId: request.userId, isCancelled: true },
                        });
                    }
                    // if the request is to delete the bookings, delete all associated booking records
                    if (request.deleteBookings) {
                        await tx.booking.deleteMany({
                            where: { userId: request.userId, isAnonymized: true },
                        });
                    }

                    // if the request is to delete the account, delete the user record after all associated records have been deleted
                    if (request.deleteAccount) {
                        await tx.user.deleteMany({
                            where: { id: request.userId, isDeleted: true },
                        });
                    }

                    
                });
            }
            catch (error) {
                console.error(`Error processing deletion request for userId ${request.userId}:`, error);
            }
        }
    }
    catch (error) {
        console.error('Error during hard delete task:', error);
    }
}

cron.schedule('0 0 * * *', async () => {
    await hardDeleteProcess();
});

module.exports = {
    hardDeleteProcess,
};