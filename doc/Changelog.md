Sprint 2 - Story 1
Version: v1.2.0

Story: As an admin, I want a log that complies to the related law.

1. Centralized Logging Service 
เพิ่ม service หลักสำหรับจัดการบันทึกและดึงข้อมูล Log ของระบบทั้งหมด
    - createLog: ฟังก์ชันสำหรับบันทึกกิจกรรมลง Database รองรับการเก็บข้อมูลมาตรฐาน (userId, action, level, resource, IP Address, User-Agent, Status, Protocol) ตามข้อกำหนด พ.ร.บ. คอมพิวเตอร์
    - queryLogs: ระบบดึงข้อมูล Log พร้อมรองรับการทำ Pagination
    - getLogById: ระบบดึงข้อมูล Log รายบุคคลเพื่อดูรายละเอียด (JSON details) เชิงลึก
    - exportLogsToJSON: ระบบส่งออกข้อมูล Log เป็นไฟล์ JSON
    - deleteLogsOlderThan: ระบบลบข้อมูล Log เก่าอัตโนมัติ (Data Retention Policy)

2. Advanced Search & Filtering 
ปรับปรุง Endpoint เพื่อให้ Admin สามารถค้นหาและกรองข้อมูล Log ได้อย่างละเอียด
    - เพิ่ม API: GET /api/system-logs
    - รองรับการ Filter ตามเงื่อนไข:
        - action (เช่น LOGIN, CREATE_DATA, DELETE_DATA)
        - level (INFO, WARNING, ERROR, CRITICAL)
        - resource (User, Booking, Route)
        - startDate / endDate / startTime / endTime
    - Feature Update: เพิ่ม Free-text search สามารถค้นหาข้อมูลจาก IP Address, Username และ Email ได้พร้อมกัน (Case-insensitive)

3. Data Integrity & Security for Export
เพิ่มระบบตรวจสอบความถูกต้องของไฟล์ Export เพื่อใช้เป็นหลักฐานทางกฎหมาย
    - เพิ่ม API: GET /api/api/system-logs/export
    - ผนวกการเข้ารหัส SHA-256 Signature ลงใน Metadata ของไฟล์ JSON อัตโนมัติ เพื่อป้องกันการแก้ไขข้อมูล (Data Tampering)
    - ระบบจะทำการบันทึก Log ระดับ WARNING อัตโนมัติทุกครั้งที่มี Admin สั่ง Export ข้อมูล พร้อมเก็บค่า Hash ไว้เป็นหลักฐานตรวจสอบย้อนหลัง

4. Automated Log Cleanup (Cron Job)
เพิ่มระบบทำความสะอาดฐานข้อมูลอัตโนมัติ เพื่อป้องกัน Database บวมและปฏิบัติตาม PDPA
    - ตั้งเวลา Cron Job รันทุกเวลา 00:00 น. (เที่ยงคืน) ของทุกวัน
    - ลบข้อมูล Log ที่มีอายุเกิน 90 วัน ทิ้งแบบ Hard Delete
    - ระบบจะบันทึก Log อัตโนมัติทุกครั้งหลังทำความสะอาดเสร็จสิ้น ว่าระบบได้ลบข้อมูลไปจำนวนกี่รายการ

5. Activity Tracking Middleware
เพิ่ม Middleware logActivity เพื่อนำไปฝังตาม Route ต่างๆ สำหรับดักจับเหตุการณ์อัตโนมัติ
    - ดักจับและบันทึกข้อมูลทุก Request ที่ทำงานสำเร็จหรือล้มเหลว
    - Updated Routes: มีการนำ Middleware เข้าไปฝังใน API สำคัญแล้ว ได้แก่:
        - routes/user.routes.js: ดักจับการดูรายชื่อ, แก้ไข, ลบข้อมูล, อนุมัติยืนยันตัวตน, สมัครสมาชิก, แก้ไขโปรไฟล์ และการลบบัญชีตัวเอง (/me)
        - routes/deleteRequest.routes.js: ดักจับเวลายื่นคำขอลบข้อมูล (DELETE_DATA)

Updated
- เพิ่มข้อมูล level (ระดับความรุนแรง) และ resource (ระบบที่เกิดเหตุการณ์) เพื่อให้หน้า Admin Dashboard สามารถนำไปใช้ในระบบ Filter_logs()
- ปรับ validations systemLog เพิ่มการรองรับการกรอง (Filter) ระดับความรุนแรง และรองรับการกรองตามโมดูล
- เพิ่ม SHA-256 Hashing: สร้างลายเซ็นดิจิทัล (Digital Signature) ให้กับไฟล์ Export เพื่อให้ตรวจสอบได้ว่าไฟล์ถูกดัดแปลงหรือไม่
- ปรับ Middleware ให้ดักจับตอนที่ Request ทำงานเสร็จสิ้น (Finish) เพื่อให้รู้ว่า Action นั้น "สำเร็จ" หรือ "ล้มเหลว"
- เพิ่มการเก็บข้อมูล Protocol (เช่น HTTP/1.1)
- ปรับ controllers user , routes deleteRequest และ route user ให้ admin เห็นสถานะ delete เมื่อ User ลบบัญชีตัวเอง
- ปรับ route vehicle ให้ admin เห็นสถานะการ create/update/delete ยานพาหนะได้

Security & Compliance Improvements
- บังคับใช้ Middleware protect และ requireAdmin กับทุก Endpoint ใน systemLog.routes.js
- ข้อมูลอ่อนไหว (Sensitive Data) จะถูก Filter หรือไม่นำมาแสดงผลในหน้า Log โดยตรง

------------------------------------------------------------------------------------------------------------------------------------------------------

Sprint 2 - Story 16
Version: v1.2.0

Story: As a user, I want my account and information to be removed from the system when I no longer want to be a part of this community.

1. OTP Verification Before Account Deletion
    เพิ่มระบบส่ง OTP ไปยังอีเมลผู้ใช้ก่อนยืนยันการลบบัญชี
        เพิ่ม API:
            POST /api/otp/createOtp – ส่ง OTP ไปยังอีเมล
            POST /api/otp/verifyOtp – ยืนยัน OTP และดำเนินการลบ
    OTP มีอายุการใช้งาน (expiration time)
    OTP ใช้ได้ครั้งเดียว (one-time use)

2. Soft Delete Mechanism
    เพิ่ม field ในตาราง users:
        isDeleted
        deletedAt
    ปรับปรุง logic ทุก endpoint ให้ไม่แสดงผู้ใช้ที่ถูกลบแล้ว
    ป้องกันการ login ของผู้ใช้ที่ถูกลบ

3. Email Notification After Deletion
    ส่งอีเมลแจ้งว่าการลบบัญชีดำเนินการเสร็จสิ้น
    แนบข้อมูลสรุปบัญชีที่ถูกลบ (User Snapshot)

4. User Data Snapshot
    เก็บข้อมูลผู้ใช้ก่อนลบ เช่น:
        username
        email
        role
        createdAt
    ใช้สำหรับแนบในอีเมลแจ้งลบ

5. Session Invalidation
    บังคับ logout ผู้ใช้ทันทีหลังลบ
    ป้องกันการใช้ token เดิมหลังลบ

Updated
- ปรับปรุง middleware authentication ให้ตรวจสอบ isDeleted
- ปรับ logic login ให้ปฏิเสธผู้ใช้ที่ถูกลบแล้ว
- ปรับ validation flow สำหรับการลบบัญชี

Security Improvements
- เพิ่มการยืนยันตัวตนด้วย OTP แทน password
- OTP ถูก invalidate หลังใช้งาน

AI Declaration

รายงานฉบับนี้ ในการทำงานทั้ง 3 Sprint ที่ผ่านมาได้นําปัญญาประดิษฐ์ GPT-4.1, Gemini Pro , Claude มาใช้ในขั้นตอนดังต่อไปนี้ 

(1) ใช้ในการช่วยตั้งค่าและแก้ไขปัญหาสภาพแวดล้อมของโปรเจกต์

(2) ใช้ในการช่วยวิเคราะห์และแก้ไขปัญหาข้อผิดพลาดของโค้ด

(3) ใช้ในการช่วยออกแบบและเรียบเรียงข้อความเพื่อเขียนเอกสาร

(4) ช่วยแนะนำแนวทางการเขียนโค้ดและ logic การทำงาน

โดยข้าพเจ้าได้ตรวจสอบความถูกต้องและแก้ไขข้อผิดพลาดอันเนื่องมาจากผลลัพธ์จากปัญญาประดิษฐ์เรียบร้อยแล้ว
