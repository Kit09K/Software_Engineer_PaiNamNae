const asyncHandler = require("express-async-handler");
const vehicleService = require("../services/vehicle.service");
const ApiError = require("../utils/ApiError");
const { uploadToCloudinary } = require('../utils/cloudinary');
const userService = require("../services/user.service");
const prisma = require('../lib/prisma');

const listMyVehicles = asyncHandler(async (req, res) => {
  const ownerId = req.user.sub;
  const result = await vehicleService.searchMyVehicles(ownerId, req.query);
  res.status(200).json({
    success: true,
    message: "Vehicles retrieved successfully.",
    ...result
  });
});

const getVehicles = asyncHandler(async (req, res) => {
  const ownerId = req.user.sub;
  const list = await vehicleService.getAllVehicles(ownerId);

  res.status(200).json({
    success: true,
    message: "Vehicles retrieved successfully.",
    data: list,
  });
});

const getVehicleById = asyncHandler(async (req, res) => {
  const ownerId = req.user.sub;
  const { id } = req.params;
  const vehicle = await vehicleService.getVehicleById(id, ownerId);

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  res.status(200).json({
    success: true,
    message: "Vehicle retrieved successfully.",
    data: vehicle,
  });
});

const getVehicleByIdAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vehicle = await vehicleService.getVehicleByIdAdmin(id);

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  res.status(200).json({
    success: true,
    message: "Vehicle retrieved successfully.",
    data: vehicle,
  });
});


const createVehicle = asyncHandler(async (req, res) => {
  const ownerId = req.user.sub;
  const payload = { ...req.body };

  if (req.files?.photos) {
    const uploads = await Promise.all(
      req.files.photos.map(file =>
        uploadToCloudinary(file.buffer, 'painamnae/vehicles')
      )
    );

    payload.photos = uploads.map(u => u.url);
  }

  const newVehicle = await vehicleService.createVehicle(payload, ownerId);

  try {
    await prisma.systemLog.create({
      data: {
        action: 'CREATE_DATA',
        userId: ownerId,
        targetTable: 'Vehicle',
        targetId: newVehicle.id,
        ipAddress: req.ip || req.connection.remoteAddress || '0.0.0.0',
        userAgent: req.headers['user-agent'],
        details: { 
            message: 'Driver added a new vehicle', 
            licensePlate: payload.licensePlate 
        }
      }
    });
  } catch (e) { console.error("Log error (createVehicle):", e.message); }

  res.status(201).json({
    success: true,
    message: "Vehicle created successfully.",
    data: newVehicle,
  });
});

const updateVehicle = asyncHandler(async (req, res) => {
  const ownerId = req.user.sub;
  const { id } = req.params
  const payload = { ...req.body };

  if (req.files?.photos) {
    const uploads = await Promise.all(
      req.files.photos.map(file =>
        uploadToCloudinary(file.buffer, 'painamnae/vehicles')
      )
    );
    payload.photos = uploads.map(u => u.url);
  }

  const updated = await vehicleService.updateVehicle(id, ownerId, payload)

  try {
    await prisma.systemLog.create({
      data: {
        action: 'UPDATE_DATA',
        userId: ownerId,
        targetTable: 'Vehicle',
        targetId: id,
        ipAddress: req.ip || req.connection.remoteAddress || '0.0.0.0',
        userAgent: req.headers['user-agent'],
        details: { 
            message: 'Driver updated vehicle', 
            changedFields: Object.keys(payload) 
        }
      }
    });
  } catch (e) { console.error("Log error (updateVehicle):", e.message); }

  res.status(200).json({
    success: true,
    message: "Vehicle updated successfully.",
    data: updated,
  });
});

const deleteVehicle = asyncHandler(async (req, res) => {
  const ownerId = req.user.sub;
  const { id } = req.params;
  const result = await vehicleService.deleteVehicle(id, ownerId);

  try {
    await prisma.systemLog.create({
      data: {
        action: 'DELETE_DATA',
        userId: ownerId,
        targetTable: 'Vehicle',
        targetId: id,
        ipAddress: req.ip || req.connection.remoteAddress || '0.0.0.0',
        userAgent: req.headers['user-agent'],
        details: { message: 'Driver deleted vehicle' }
      }
    });
  } catch (e) { console.error("Log error (deleteVehicle):", e.message); }

  res.status(200).json({
    success: true,
    message: "Vehicle deleted successfully.",
    data: result,
  });
});

const setDefaultVehicle = asyncHandler(async (req, res) => {
  const ownerId = req.user.sub;
  const { id } = req.params;
  const result = await vehicleService.setDefaultVehicle(id, ownerId);

  res.status(200).json({
    success: true,
    message: "Vehicle set Default successfully.",
    data: result,
  });
});

const adminListVehicles = asyncHandler(async (req, res) => {
  const result = await vehicleService.searchVehiclesAdmin(req.query);
  res.status(200).json({
    success: true,
    message: "Vehicles (admin) retrieved successfully.",
    ...result
  });
});

const adminListVehiclesByUser = asyncHandler(async (req, res) => {
  const result = await vehicleService.searchVehiclesAdmin({ ...req.query, userId: req.params.userId });
  res.status(200).json({
    success: true,
    message: "User's vehicles (admin) retrieved successfully.",
    ...result
  });
});

const adminCreateVehicle = asyncHandler(async (req, res) => {
  const { userId } = req.body
  const payload = { ...req.body };

  await userService.getUserById(userId)

  if (req.files?.photos) {
    const uploads = await Promise.all(
      req.files.photos.map(file =>
        uploadToCloudinary(file.buffer, 'painamnae/vehicles')
      )
    );

    payload.photos = uploads.map(u => u.url);
  }

  const newVehicle = await vehicleService.createVehicle(payload, userId);

  try {
    await prisma.systemLog.create({
      data: {
        action: 'CREATE_DATA',
        userId: req.user.sub,
        targetTable: 'Vehicle',
        targetId: newVehicle.id,
        ipAddress: req.ip || req.connection.remoteAddress || '0.0.0.0',
        userAgent: req.headers['user-agent'],
        details: { 
            message: 'Admin created vehicle for user', 
            targetUserId: userId,
            licensePlate: payload.licensePlate
        }
      }
    });
  } catch (e) { console.error("Log error (adminCreateVehicle):", e.message); }

  res.status(201).json({
    success: true,
    message: "Vehicle created successfully.",
    data: newVehicle,
  });
})

const adminUpdateVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payload = { ...req.body };

  if (payload.userId) {
    await userService.getUserById(payload.userId);
  }

  if (req.files?.photos) {
    const uploads = await Promise.all(
      req.files.photos.map(file => uploadToCloudinary(file.buffer, 'painamnae/vehicles'))
    );
    payload.photos = uploads.map(u => u.url);
  }

  const updated = await vehicleService.updateVehicleByAdmin(id, payload);

  try {
    await prisma.systemLog.create({
      data: {
        action: 'UPDATE_DATA',
        userId: req.user.sub,
        targetTable: 'Vehicle',
        targetId: id,
        ipAddress: req.ip || req.connection.remoteAddress || '0.0.0.0',
        userAgent: req.headers['user-agent'],
        details: { 
            message: 'Admin updated vehicle', 
            changedFields: Object.keys(payload) 
        }
      }
    });
  } catch (e) { console.error("Log error (adminUpdateVehicle):", e.message); }

  res.status(200).json({
    success: true,
    message: "Vehicle (by admin) updated successfully.",
    data: updated,
  });
});

const adminDeleteVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await vehicleService.deleteVehicleByAdmin(id);

  try {
    await prisma.systemLog.create({
      data: {
        action: 'DELETE_DATA',
        userId: req.user.sub,
        targetTable: 'Vehicle',
        targetId: id,
        ipAddress: req.ip || req.connection.remoteAddress || '0.0.0.0',
        userAgent: req.headers['user-agent'],
        details: { message: 'Admin deleted vehicle' }
      }
    });
  } catch (e) { console.error("Log error (adminDeleteVehicle):", e.message); }

  res.status(200).json({
    success: true,
    message: "Vehicle (by admin) deleted successfully.",
    data: result,
  });
});

module.exports = {
  listMyVehicles,
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  setDefaultVehicle,
  adminCreateVehicle,
  adminUpdateVehicle,
  adminDeleteVehicle,
  adminListVehiclesByUser,
  adminListVehicles,
  getVehicleByIdAdmin,
};
