class PushNotificationController {
    constructor(pushNotificationService) {
        this.pushNotificationService = pushNotificationService;
    }

    async subscribe(req, res) {
        try {
        const { subscription } = req.body;
        const userId = req.user.sub;

        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ error: 'Invalid subscription data' });
        }

        const result = await this.pushNotificationService.saveSubscription(userId, subscription);

        return res.status(201).json({
            success: true,
            message: 'Subscribed successfully',
            data: result
        });

        } catch (error) {
        console.error('Controller Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async sendPush(req, res) {
        try {
        // รับ targetUserId (คนที่ต้องการส่งหา) และ payload (เนื้อหา) จาก Frontend / Postman
        const { targetUserId, title, body, url } = req.body;

        if (!targetUserId || !title) {
            return res.status(400).json({ error: 'Missing targetUserId or title' });
        }

        // จัดรูปแบบข้อความที่จะส่งให้เบราว์เซอร์
        const payload = {
            title: title,
            body: body || '',
            url: url || '/',
            // สามารถเพิ่มข้อมูลอื่นๆ เช่น icon, image ได้ตามต้องการ
        };

        // เรียกใช้ Service เพื่อยิงแจ้งเตือน
        const result = await this.pushNotificationService.sendPushToUser(targetUserId, payload);

        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }

        return res.status(200).json({
            success: true,
            message: 'Push notification sent successfully'
        });

        } catch (error) {
        console.error('Send Push Error:', error);
        return res.status(500).json({ error: 'Failed to send push notification' });
        }
    }
}

module.exports = PushNotificationController;