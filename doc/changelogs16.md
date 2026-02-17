Changelogs for story 16
•	เพิ่ม User Story ใหม่
As a user, I want my account and information to be removed from the system when I no longer want to be a part of this community.
•	เพิ่มระบบ Soft Delete สำหรับผู้ใช้งาน
o	ผู้ใช้สามารถเลือกได้ว่าจะลบ:
	บัญชีผู้ใช้ (Account)
	ข้อมูลยานพาหนะ (Vehicles)
	ข้อมูลเส้นทาง (Routes)
	ข้อมูลการจอง (Bookings)
o	รองรับการเลือกส่งสำเนาข้อมูลที่ถูกลบทาง Email
•	เพิ่ม UI หน้า Delete Account
o	Checkbox สำหรับเลือกประเภทข้อมูลที่จะลบ
o	Confirm modal โดยต้องพิมพ์ confirm
o	Disable ปุ่มเมื่อไม่มีข้อมูลถูกเลือก
o	Logout อัตโนมัติหลังลบบัญชีสำเร็จ
•	เพิ่ม API Endpoint
•	POST /api/delete/account
สำหรับสร้าง delete request และดำเนินการ soft delete
•	เพิ่ม Email Service
o	ส่ง email ยืนยันการลบข้อมูล
o	แนบไฟล์ JSON ของข้อมูลที่ถูกลบ (delete receipt)
Database Change
•	เพิ่ม field ใน schema:
o	User.isDeleted
o	User.deletedAt
•	เพิ่มตารางใหม่:
o	DeletionRequest
	เก็บรายละเอียดการลบข้อมูล
	ประเภทข้อมูลที่เลือก
	สถานะคำขอ
	เวลาที่ร้องขอและเวลาที่ดำเนินการเสร็จ

Changed
•	ปรับ query logic ให้:
o	ไม่แสดง user ที่ isDeleted = true
o	ไม่แสดงข้อมูลที่ถูก soft delete ในหน้าเว็บ
•	ปรับ authentication logic
o	ผู้ใช้ที่ถูกลบไม่สามารถ login ได้

Testing
•	เพิ่ม Unit Test สำหรับ:
o	DeleteService
o	EmailService
•	เพิ่ม API Test
o	Login → Delete Account → Verify Response
•	เพิ่ม UAT Test ด้วย Robot Framework
o	ทดสอบ flow การลบบัญชีผ่าน UI

Technical Improvements
•	แยก Service Layer สำหรับ deletion logic
•	ใช้ Prisma transaction สำหรับ update ข้อมูลที่เกี่ยวข้อง
•	เพิ่ม mock Prisma สำหรับ unit testing

