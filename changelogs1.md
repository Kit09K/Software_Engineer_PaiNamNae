All notable changes to this project will be documented in this file.

## [Unreleased]

[Sprint1]

1. ระบบรักษาความปลอดภัยและการตรวจสอบ (Security & Audit System)

[Added] ระบบ System Logs เพื่อจัดเก็บข้อมูลจราจรทางคอมพิวเตอร์ตาม พ.ร.บ. คอมพิวเตอร์ และ Audit Trail ตามหลัก PDPA

[Added] middlewares/logging.js สำหรับดักจับกิจกรรมสำคัญ (Critical Actions) โดยอัตโนมัติในระดับ Router

[Added] middlewares/systemLog.validation.js เพื่อตรวจสอบความถูกต้องของข้อมูล Query เช่น ช่วงวันที่ และ Pagination

[Enhanced] middlewares/errorHandler.js ให้สามารถบันทึก System Error (500) และ Data Conflict (409) ลงในฐานข้อมูลเพื่อการวิเคราะห์ย้อนหลัง


2. การจัดการข้อมูลและ API (Data Handling)

[Added] services/systemLog.service.js สำหรับการเขียน/อ่าน ข้อมูล Log และระบบ Cleanup ข้อมูลที่เก่ากว่า 90 วัน

[Added] controllers/systemLog.controller.js สำหรับให้ Admin เรียกดูและกรองข้อมูล Logs ผ่านหน้า Dashboard

[Updated] รวมระบบบันทึก Log เข้ากับ Controller หลัก ได้แก่:
auth.controller.js (บันทึกการ Login/Logout/Change Password)
user.controller.js (บันทึกการแก้ไขข้อมูลส่วนบุคคล/การลบ User)
driverVerification.controller.js (บันทึกการ Approve/Reject เอกสารคนขับ)
route.controller.js (บันทึกการสร้าง/แก้ไข/ยกเลิก เส้นทาง)
delete.controller.js (บันทึกหลักฐานการขอลบข้อมูลตามสิทธิ PDPA)

3. โครงสร้างฐานข้อมูล (Database Structure)

[Added] ตาราง SystemLog ใน Prisma Schema รองรับฟิลด์ ipAddress, userAgent, action และ details (JSONB)

[Updated] เพิ่มความสัมพันธ์แบบ Many-to-One ระหว่าง SystemLog และ User เพื่อระบุตัวตนผู้กระทำกิจกรรม

4. ไฟล์และโครงสร้างโปรเจกต์ (Project Structure)

[Added] routes/systemLog.routes.js สำหรับจัดการเส้นทาง API ของระบบ Log โดยเฉพาะ

[Refactored] routes/index.js เพื่อลงทะเบียนเส้นทาง API ใหม่สำหรับ Admin

[Added] docs/systemLog.doc.js เพื่อทำ API Documentation (Swagger) สำหรับระบบ Audit Log


5. การปรับปรุงส่วนติดต่อผู้ใช้ (UI/UX Improvements)

[Modified] ปรับปรุงหน้า Admin Dashboard ให้รองรับการเรียกดูประวัติกิจกรรม (Activity Logs) ย้อนหลัง

[Modified] เพิ่มตัวกรองข้อมูล (Filter) ตามช่วงวันที่ และประเภทกิจกรรมในหน้า System Logs
