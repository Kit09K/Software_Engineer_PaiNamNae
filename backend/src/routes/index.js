// backend/src/routes/index.js
const express = require('express');
const router = express.Router();

// Import Route Files
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const vehicleRoutes = require('./vehicle.routes');
const routeRoutes = require('./route.routes');
const driverVerifRoutes = require('./driverVerification.routes');
const bookingRoutes = require('./booking.routes');

const deleteRoutes = require('./delete.routes');

const notificationRoutes = require('./notification.routes');
const mapRoutes = require('./maps.routes');
const adminRoutes = require('./admin');

// Mount Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/routes', routeRoutes);
router.use('/driver-verifications', driverVerifRoutes);
router.use('/bookings', bookingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/api/maps', mapRoutes);
router.use('/delete', deleteRoutes);
router.use('/admin', adminRoutes);

router.use('/maps', mapRoutes); 

module.exports = router;