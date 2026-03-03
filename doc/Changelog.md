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