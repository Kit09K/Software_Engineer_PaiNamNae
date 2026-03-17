-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'VERIFICATION', 'BOOKING', 'ROUTE', 'SECURITY_ALERT');
-- เพิ่ม 'SECURITY_ALERT' เพื่อให้ Admin ได้รับแจ้งเตือนเมื่อมีเหตุการณ์สำคัญ (เช่น การเข้าถึงข้อมูลส่วนบุคคล)

-- Create "Notification" Table
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'VERIFICATION', 'BOOKING', 'ROUTE');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminReviewedAt" TIMESTAMP(3), -- ใช้ทำ Audit ได้ว่า Admin รับทราบปัญหาแล้ว
    "metadata" JSON,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");
CREATE INDEX "Notification_adminReviewedAt_idx" ON "Notification"("adminReviewedAt");
CREATE INDEX "Notification_type_idx" ON "Notification"("type"); -- เพื่อให้ดึงเฉพาะ 'SECURITY_ALERT' มาแสดงให้ Admin ได้เร็วขึ้น
-- เพิ่ม: ทำให้ Admin Filter ค้นหา Notification จาก ID ของ Log ที่อยู่ใน metadata ได้ทันที
CREATE INDEX "Notification_metadata_idx" ON "Notification" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "DriverVerification_status_idx" ON "DriverVerification"("status");

-- CreateIndex
CREATE INDEX "DriverVerification_createdAt_idx" ON "DriverVerification"("createdAt");

-- CreateIndex
CREATE INDEX "DriverVerification_licenseIssueDate_idx" ON "DriverVerification"("licenseIssueDate");

-- CreateIndex
CREATE INDEX "DriverVerification_licenseExpiryDate_idx" ON "DriverVerification"("licenseExpiryDate");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "User_isVerified_idx" ON "User"("isVerified");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
