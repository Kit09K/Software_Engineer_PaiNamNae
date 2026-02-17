/*
  Warnings:

  - A unique constraint covering the columns `[nationalIdNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/

-- Create "User" Index
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_isActive_idx" ON "User"("isActive");
CREATE INDEX "User_isVerified_idx" ON "User"("isVerified");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- Create "DriverVerification" Index
CREATE INDEX "DriverVerification_status_idx" ON "DriverVerification"("status");
CREATE INDEX "DriverVerification_createdAt_idx" ON "DriverVerification"("createdAt");
CREATE INDEX "DriverVerification_licenseIssueDate_idx" ON "DriverVerification"("licenseIssueDate");
CREATE INDEX "DriverVerification_licenseExpiryDate_idx" ON "DriverVerification"("licenseExpiryDate");

-- Create "Vehicle" Index
CREATE INDEX "Vehicle_userId_idx" ON "Vehicle"("userId");
CREATE INDEX "Vehicle_createdAt_idx" ON "Vehicle"("createdAt");
CREATE INDEX "Vehicle_vehicleType_idx" ON "Vehicle"("vehicleType");
CREATE INDEX "Vehicle_seatCapacity_idx" ON "Vehicle"("seatCapacity");

-- Create "Route" Index
CREATE INDEX "Route_driverId_idx" ON "Route"("driverId");
CREATE INDEX "Route_vehicleId_idx" ON "Route"("vehicleId");
CREATE INDEX "Route_status_idx" ON "Route"("status");
CREATE INDEX "Route_createdAt_idx" ON "Route"("createdAt");
CREATE INDEX "Route_departureTime_idx" ON "Route"("departureTime");

-- Create "SystemLog" Index
CREATE INDEX "SystemLog_timestamp_idx" ON "SystemLog"("timestamp");
CREATE INDEX "SystemLog_userId_idx" ON "SystemLog"("userId");
CREATE INDEX "SystemLog_action_idx" ON "SystemLog"("action");