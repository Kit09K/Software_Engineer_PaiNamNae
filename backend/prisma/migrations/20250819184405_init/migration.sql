-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PASSENGER', 'DRIVER', 'ADMIN');
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "RouteStatus" AS ENUM ('AVAILABLE', 'FULL', 'COMPLETED', 'CANCELLED', 'IN_TRANSIT');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED');
CREATE TYPE "CancelReason" AS ENUM ('CHANGE_OF_PLAN', 'FOUND_ALTERNATIVE', 'DRIVER_DELAY', 'PRICE_ISSUE', 'WRONG_LOCATION', 
        'DUPLICATE_OR_WRONG_DATE', 'SAFETY_CONCERN', 'WEATHER_OR_FORCE_MAJEURE', 'COMMUNICATION_ISSUE');
CREATE TYPE "LicenseType" AS ENUM ('PRIVATE_CAR_TEMPORARY', 'PRIVATE_CAR', 'PUBLIC_CAR', 'LIFETIME');
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'VERIFICATION', ' BOOKING', 'ROUTE');
CREATE TYPE "LogAction" AS ENUM ('LOGIN', 'LOGOUT', 'ACCESS_SENSITIVE_DATA', 'CREATE_DATA', 'UPDATE_DATA', 'DELETE_DATA',
        'APPROVE_VERIFICATION', 'REJECT_VERIFICATION', 'SOS_TRIGGERED');

-- Create "User" Table
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL UNIQUE,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "gender" TEXT,
    "phoneNumber" TEXT,
    "profilePicture" TEXT,
    "nationalIdNumber" TEXT UNIQUE,
    "nationalIdPhotoUrl" TEXT UNIQUE,
    "nationalIdExpiryDate" TIMESTAMP(3),
    "selfiePhotoUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PASSENGER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "otpCode" TEXT,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "passengerSuspendedUntil" TIMESTAMP(3),
    "driverSuspendedUntil" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Create "DriverVerification" Table
CREATE TABLE "DriverVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL UNIQUE,
    "licenseNumber" TEXT NOT NULL UNIQUE,
    "firstNameOnLicense" TEXT NOT NULL,
    "lastNameOnLicense" TEXT NOT NULL,
    "licenseIssueDate" TIMESTAMP(3) NOT NULL,
    "licenseExpiryDate" TIMESTAMP(3) NOT NULL,
    "licensePhotoUrl" TEXT NOT NULL,
    "selfiePhotoUrl" TEXT NOT NULL,
    "typeOnLicense" "LicenseType" NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DriverVerification_pkey" PRIMARY KEY ("id")
);

-- Create "Vehicle" Table 
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleModel" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL UNIQUE,
    "vehicleType" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "seatCapacity" INTEGER NOT NULL,
    "amenities" TEXT[],
    "photos" JSON,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- Create "Route" Table
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "startLocation" JSON NOT NULL,
    "endLocation" JSON NOT NULL,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "pricePerSeat" DOUBLE PRECISION NOT NULL,
    "conditions" TEXT,
    "status" "RouteStatus" NOT NULL DEFAULT 'AVAILABLE',
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "routePolyline" TEXT,
    "distanceMeters" INTEGER,
    "durationSeconds" INTEGER,
    "routeSummary" TEXT,
    "distance" TEXT,
    "duration" TEXT,
    "waypoints" JSON,
    "landmarks" JSON,
    "steps" JSON,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancelReason" TEXT,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- Create "Booking" Table
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "numberOfSeats" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancelReason" "CancelReason",
    "pickupLocation" JSON NOT NULL,
    "dropoffLocation" JSON NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAnonymized" BOOLEAN NOT NULL DEFAULT false,
    "passengerName" TEXT,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- Create "DeletionRequest" Table
CREATE TABLE "DeletionRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deleteAccount" BOOLEAN NOT NULL,
    "deleteVehicles" BOOLEAN NOT NULL,
    "deleteRoutes" BOOLEAN NOT NULL,
    "deleteBookings" BOOLEAN NOT NULL,
    "sendEmailCopy" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DeletionRequest_pkey" PRIMARY KEY ("id")
)

-- Create "SystemLog" Table
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "targetTable" TEXT,
    "targetId" TEXT,
    "details" JSON,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- Create "User" Index
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_nationalIdNumber_key" ON "User"("nationalIdNumber");
CREATE UNIQUE INDEX "User_nationalIdPhotoUrl_key" ON "User"("nationalIdPhotoUrl");

-- Create "DriverVerification" Index
CREATE UNIQUE INDEX "DriverVerification_userId_key" ON "DriverVerification"("userId");
CREATE UNIQUE INDEX "DriverVerification_licenseNumber_key" ON "DriverVerification"("licenseNumber");

-- Create "Vehicle" Index
CREATE UNIQUE INDEX "Vehicle_licensePlate_key" ON "Vehicle"("licensePlate");

-- AddForeignKey "DriverVerification"
ALTER TABLE "DriverVerification" ADD CONSTRAINT "DriverVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey "Vehicle"
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey "Route"
ALTER TABLE "Route" ADD CONSTRAINT "Route_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Route" ADD CONSTRAINT "Route_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey "Booking"
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add ForeignKey for SystemLog
ALTER TABLE "SystemLog" ADD CONSTRAINT "SystemLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;