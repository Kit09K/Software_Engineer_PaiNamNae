const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const vehicleRoutes = require('./vehicle.routes');
const routeRoutes   = require('./route.routes');
const driverVerifRoutes = require('./driverVerification.routes');
const bookingRoutes = require('./booking.routes');
const notificationRoutes = require('./notification.routes')
const deleteRequestRoutes = require('./deleteRequest.routes');
const OtpRoutes = require('./otp.routes');
const mapRoutes = require('./maps.routes')
const systemLogRoutes = require('./systemLog.routes')
const pushNotificationRoutes = require('./pushNotification.routes')
const logIntegrityRoutes = require('./logIntegrity.routes')



const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/routes', routeRoutes);
router.use('/driver-verifications', driverVerifRoutes);
router.use('/bookings', bookingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/delete-request', deleteRequestRoutes);
router.use('/otp', OtpRoutes);
router.use('/api/maps', mapRoutes);
router.use('/system-logs', systemLogRoutes);
router.use('/push-notifications', pushNotificationRoutes);
router.use('/logs', logIntegrityRoutes);

module.exports = router;