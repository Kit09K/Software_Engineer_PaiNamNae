-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'VERIFICATION', 'BOOKING', 'ROUTE', 'SECURITY_ALERT');
-- เพิ่ม 'SECURITY_ALERT' เพื่อให้ Admin ได้รับแจ้งเตือนเมื่อมีเหตุการณ์สำคัญ (เช่น การเข้าถึงข้อมูลส่วนบุคคล)

-- Create "Notification" Table
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

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");
CREATE INDEX "Notification_adminReviewedAt_idx" ON "Notification"("adminReviewedAt");
CREATE INDEX "Notification_type_idx" ON "Notification"("type"); -- เพื่อให้ดึงเฉพาะ 'SECURITY_ALERT' มาแสดงให้ Admin ได้เร็วขึ้น
-- เพิ่ม: ทำให้ Admin Filter ค้นหา Notification จาก ID ของ Log ที่อยู่ใน metadata ได้ทันที
CREATE INDEX "Notification_metadata_idx" ON "Notification" USING GIN ("metadata");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
