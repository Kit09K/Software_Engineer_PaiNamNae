const asyncHandler = require("express-async-handler");
const bookingService = require("../services/booking.service");
const ApiError = require("../utils/ApiError");
const prisma = require('../lib/prisma');

const adminListBookings = asyncHandler(async (req, res) => {
  const result = await bookingService.searchBookingsAdmin(req.query);
  res.status(200).json({ success: true, message: 'Bookings (admin) retrieved', ...result });
});

const adminCreateBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.adminCreateBooking(req.body);

  try {
    await prisma.systemLog.create({
      data: {
        action: 'CREATE_DATA',
        userId: req.user.sub,
        targetTable: 'Booking',
        targetId: booking.id,
        ipAddress: req.ip || req.connection.remoteAddress || '0.0.0.0',
        userAgent: req.headers['user-agent'],
        details: { message: 'Admin created a booking', routeId: req.body.routeId }
      }
    });
  } catch (e) { console.error("Log error:", e.message); }

  res.status(201).json({ success: true, data: booking });
});

const adminUpdateBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await bookingService.adminUpdateBooking(id, req.body);

  try {
    await prisma.systemLog.create({
      data: {
        action: 'UPDATE_DATA',
        userId: req.user.sub,
        targetTable: 'Booking',
        targetId: id,
        ipAddress: req.ip || req.connection.remoteAddress || '0.0.0.0',
        userAgent: req.headers['user-agent'],
        details: { message: 'Admin updated booking details', updatedFields: Object.keys(req.body) }
      }
    });
  } catch (e) { console.error("Log error:", e.message); }

  res.status(200).json({ success: true, data: updated });
});

const createBooking = asyncHandler(async (req, res) => {
  const passengerId = req.user.sub;
  const payload = {
    routeId: req.body.routeId,
    numberOfSeats: req.body.numberOfSeats,
    pickupLocation: req.body.pickupLocation,
    dropoffLocation: req.body.dropoffLocation,
  };

  const booking = await bookingService.createBooking(payload, passengerId);

  try {
    await prisma.systemLog.create({
      data: {
        action: 'CREATE_DATA',
        userId: passengerId,
        targetTable: 'Booking',
        targetId: booking.id,
        ipAddress: req.ip || req.connection.remoteAddress || '0.0.0.0',
        userAgent: req.headers['user-agent'],
        details: { 
            message: 'User created a booking', 
            routeId: payload.routeId,
            seats: payload.numberOfSeats
        }
      }
    });
  } catch (e) { console.error("Log error:", e.message); }

  res.status(201).json({ success: true, data: booking });
});

const getMyBookings = asyncHandler(async (req, res) => {
  const passengerId = req.user.sub;
  const list = await bookingService.getMyBookings(passengerId);
  res.status(200).json({ success: true, data: list });
});

const adminGetBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const booking = await bookingService.getBookingById(id);
  if (!booking) throw new ApiError(404, 'Booking not found');

  res.status(200).json({ success: true, data: booking });
})

const getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const booking = await bookingService.getBookingById(id);
  if (!booking) throw new ApiError(404, 'Booking not found');

  const userId = req.user.sub;
  if (
    booking.passengerId !== userId &&
    booking.route.driverId !== userId
  ) {
    throw new ApiError(403, 'Forbidden');
  }

  res.status(200).json({ success: true, data: booking });
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const driverId = req.user.sub;
  const { id } = req.params;
  const { status } = req.body;

  const updated = await bookingService.updateBookingStatus(
    id,
    status,
    driverId
  );

  try {
    await prisma.systemLog.create({
      data: {
        action: 'UPDATE_DATA',
        userId: driverId,
        targetTable: 'Booking',
        targetId: id,
        ipAddress: req.ip || req.connection.remoteAddress || '0.0.0.0',
        userAgent: req.headers['user-agent'],
        details: { 
            message: 'Driver updated booking status', 
            newStatus: status 
        }
      }
    });
  } catch (e) { console.error("Log error:", e.message); }

  res.status(200).json({ success: true, data: updated });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const passengerId = req.user.sub;
  const { id } = req.params;
  const { reason } = req.body;

  const cancelled = await bookingService.cancelBooking(id, passengerId, { reason });

  try {
    await prisma.systemLog.create({
      data: {
        action: 'UPDATE_DATA',
        userId: passengerId,
        targetTable: 'Booking',
        targetId: id,
        ipAddress: req.ip || req.connection.remoteAddress || '0.0.0.0',
        userAgent: req.headers['user-agent'],
        details: { 
            message: 'User cancelled booking', 
            reason: reason,
            status: 'CANCELLED'
        }
      }
    });
  } catch (e) { console.error("Log error:", e.message); }

  res.status(200).json({ success: true, data: cancelled });
});

const deleteBooking = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  const deleted = await bookingService.deleteBooking(id, userId);

  try {
    await prisma.systemLog.create({
      data: {
        action: 'DELETE_DATA',
        userId: userId,
        targetTable: 'Booking',
        targetId: id,
        ipAddress: req.ip || req.connection.remoteAddress || '0.0.0.0',
        userAgent: req.headers['user-agent'],
        details: { message: 'User deleted booking record' }
      }
    });
  } catch (e) { console.error("Log error:", e.message); }

  res.status(200).json({ success: true, data: deleted });
});

const adminDeleteBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await bookingService.adminDeleteBooking(id);

  try {
    await prisma.systemLog.create({
      data: {
        action: 'DELETE_DATA',
        userId: req.user.sub,
        targetTable: 'Booking',
        targetId: id,
        ipAddress: req.ip || req.connection.remoteAddress || '0.0.0.0',
        userAgent: req.headers['user-agent'],
        details: { message: 'Admin deleted booking record' }
      }
    });
  } catch (e) { console.error("Log error:", e.message); }

  res.status(200).json({ success: true, data: result });
});

module.exports = {
  adminListBookings,
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  deleteBooking,
  adminGetBookingById,
  adminCreateBooking,
  adminUpdateBooking,
  adminDeleteBooking
};

