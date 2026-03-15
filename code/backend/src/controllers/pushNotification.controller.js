const prisma = require('../utils/prisma');

class PushNotificationController {
    constructor(pushNotificationService) {
        this.pushNotificationService = pushNotificationService;
    }

    subscribe = async (req, res) => {
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

    sendPush = async (req, res) => {
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

    // เพิ่ม: ฟังก์ชันสำหรับให้คนขับกดแจ้งเตือนผู้โดยสารว่าใกล้ถึงแล้ว
    notifyPassengerPickup = async (req, res) => {
        try {
            // รับ bookingId จาก request body (Driver เป็นคนกด)
            const { bookingId } = req.body;
            const driverId = req.user.sub; // สมมติว่าดึง driverId มาจาก token

            if (!bookingId) {
                return res.status(400).json({ error: 'Missing bookingId' });
            }

            // 1. ดึงข้อมูล Booking เพื่อหา passengerId และตรวจสอบสิทธิ์
            const booking = await prisma.booking.findUnique({
                where: { id: bookingId },
                include: {
                    route: true // เช็คว่าคนขับคนนี้เป็นเจ้าของ Route จริงไหม
                }
            });

            if (!booking) {
                return res.status(404).json({ error: 'Booking not found' });
            }

            // ตรวจสอบความปลอดภัย: เฉพาะคนขับของรอบนี้เท่านั้นที่กดแจ้งเตือนได้
            if (booking.route.driverId !== driverId) {
                return res.status(403).json({ error: 'Unauthorized: You are not the driver for this route' });
            }

            // 2. กำหนดเนื้อหาการแจ้งเตือน
            const passengerId = booking.passengerId;
            const title = 'คนขับกำลังจะไปถึงแล้ว! 🚗';
            const body = 'เตรียมตัวให้พร้อม คนขับกำลังเดินทางไปรับคุณที่จุดนัดหมาย';
            const link = `/bookings/${bookingId}`; // URL สำหรับให้ผู้โดยสารกดเข้าไปดูสถานะ/แชท
            const metadata = { bookingId: booking.id, routeId: booking.routeId };

            // 3. เรียกใช้ Service เพื่อบันทึกลงฐานข้อมูลและส่ง Push
            const notification = await this.pushNotificationService.sendAndSaveNotification({
                userId: passengerId,
                type: 'BOOKING', 
                title,
                body,
                link,
                metadata
            });

            return res.status(200).json({
                success: true,
                message: 'Pickup notification sent and saved successfully',
                data: notification
            });

        } catch (error) {
            console.error('Notify Pickup Error:', error);
            return res.status(500).json({ error: 'Failed to notify passenger' });
        }
    }

    // เพิ่ม: ฟังก์ชันสำหรับส่งข้อความระหว่าง Driver และ Passenger
    sendMessage = async (req, res) => {
        try {
            const { bookingId, message, messageType } = req.body;
            const senderId = req.user.sub; // ID ของคนส่งข้อความ

            if (!bookingId || !message) {
                return res.status(400).json({ error: 'Missing bookingId or message' });
            }

            // 1. ดึงข้อมูล Booking และตรวจสอบสิทธิ์
            const booking = await prisma.booking.findUnique({
                where: { id: bookingId },
                include: {
                    route: {
                        include: {
                            driver: { select: { id: true, firstName: true, lastName: true } }
                        }
                    },
                    passenger: { select: { id: true, firstName: true, lastName: true } }
                }
            });

            if (!booking) {
                return res.status(404).json({ error: 'Booking not found' });
            }

            // ตรวจสอบว่าผู้ส่งเป็น Driver หรือ Passenger ของ booking นี้
            const isDriver = booking.route.driverId === senderId;
            const isPassenger = booking.passengerId === senderId;

            if (!isDriver && !isPassenger) {
                return res.status(403).json({ error: 'Unauthorized: You are not part of this booking' });
            }

            // 2. กำหนดผู้รับและเนื้อหาข้อความ
            let receiverId, senderName, receiverName, title, body;

            if (isDriver) {
                // Driver ส่งหา Passenger
                receiverId = booking.passengerId;
                senderName = `${booking.route.driver.firstName} ${booking.route.driver.lastName}`.trim();
                receiverName = `${booking.passenger.firstName} ${booking.passenger.lastName}`.trim();
                title = `ข้อความจากผู้ขับ: ${senderName}`;
                body = message;
            } else {
                // Passenger ส่งหา Driver
                receiverId = booking.route.driverId;
                senderName = `${booking.passenger.firstName} ${booking.passenger.lastName}`.trim();
                receiverName = `${booking.route.driver.firstName} ${booking.route.driver.lastName}`.trim();
                title = `ข้อความจากผู้โดยสาร: ${senderName}`;
                body = message;
            }

            const link = `/my-trip`; 
            const metadata = { 
                bookingId: booking.id, 
                routeId: booking.routeId,
                senderId: senderId,
                senderName: senderName,
                messageType: messageType || 'general'
            };

            // 3. บันทึกและส่ง notification
            const receiverNotification = await this.pushNotificationService.sendAndSaveNotification({
                userId: receiverId,
                type: 'BOOKING', 
                title,
                body,
                link,
                metadata
            });

            return res.status(200).json({
                success: true,
                message: 'Message sent successfully',
                data: {
                    receiverNotificationId: receiverNotification.id,
                    receiverId: receiverId,
                    senderName: senderName
                }
            });

        } catch (error) {
            console.error('Send Message Error:', error);
            return res.status(500).json({ error: 'Failed to send message' });
        }
    }

}

module.exports = PushNotificationController;