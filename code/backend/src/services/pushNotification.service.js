const prisma = require('../utils/prisma');
const webpush = require('web-push');

class PushNotificationService {
    constructor() {
        webpush.setVapidDetails(
            process.env.MAILTO,
            process.env.VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );
    }

    async saveSubscription(userId, subscription) {
        try {
            const savedSubscription = await this.prisma.pushSubscription.upsert({
                where: { endpoint: subscription.endpoint },
                update: {
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth,
                    userId: userId
                },
                create: {
                    endpoint: subscription.endpoint,
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth,
                    userId: userId
                }
                });
            return savedSubscription;
        } catch (error) {
            console.error('Database Error:', error);
            throw new Error('Could not save subscription');
        }
    }

    async sendPushToUser(userId, payload) {
        try {
        // หาอุปกรณ์ทั้งหมดของ User คนนี้
        const subscriptions = await this.prisma.pushSubscription.findMany({
            where: { userId: userId }
        });

        if (subscriptions.length === 0) {
            return { success: false, message: 'No subscriptions found for this user' };
        }

        const message = JSON.stringify(payload);

        // ทยอยส่งไปทุกอุปกรณ์
        const sendPromises = subscriptions.map(async (sub) => {
            const pushConfig = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
            };

            try {
            await webpush.sendNotification(pushConfig, message);
            } catch (err) {
            // หากส่งไม่สำเร็จเพราะ endpoint หมดอายุ (404/410) ให้ลบทิ้ง
            if (err.statusCode === 404 || err.statusCode === 410) {
                await this.prisma.pushSubscription.delete({ where: { id: sub.id } });
                console.log(`Deleted expired subscription ID: ${sub.id}`);
            } else {
                console.error('Push Service Error:', err);
            }
            }
        });

        await Promise.all(sendPromises);
        return { success: true, message: 'Push sent to all active devices' };

        } catch (error) {
        console.error('Service Error:', error);
        throw new Error('Could not send push notification');
        }
    }
}

module.exports = PushNotificationService;