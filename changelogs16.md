All notable changes to this project will be documented in this file.

## [Unreleased]

[Sprint1]

1. Backend (Spring Boot / Java)
มีการแก้ไขและเพิ่มไฟล์ในส่วนของ Logic ธุรกิจและการจัดการฐานข้อมูล:

[Added] Entity Models:
src/main/java/.../models/Vehicle.java: เพิ่มคลาสโมเดลสำหรับเก็บข้อมูลรถ (ทะเบียน, สี, ยี่ห้อ, ประเภท)
src/main/java/.../models/Verification.java: เพิ่มไฟล์สำหรับเก็บสถานะการยืนยันตัวตนคนขับ
[Added] Repositories:
VehicleRepository.java: อินเตอร์เฟซสำหรับจัดการ Query ข้อมูลรถกับ Database
[Added] Controllers:
VehicleController.java: สร้าง API Endpoint สำหรับ CRUD (Create, Read, Update, Delete) ข้อมูลพาหนะ
UserController.java: เพิ่ม API สำหรับการ Update โปรไฟล์และการส่งเอกสารระดับผู้ใช้
[Modified] Security Configuration:
SecurityConfig.java: ปรับปรุงการกำหนดสิทธิ์ (Role-based access) ให้ Admin สามารถเข้าถึงจัดการข้อมูลทั้งหมดได้ และ User เข้าถึงได้เฉพาะข้อมูลของตนเอง
2. Frontend (Nuxt.js / Vue.js)
มีการเพิ่มหน้าจอการทำงานและปรับปรุงระบบจัดการข้อมูล:

[Added] New Pages (Admin & User):
pages/admin/vehicles/index.vue: หน้ารายการพาหนะทั้งหมดในระบบสำหรับผู้ดูแล
pages/admin/system-logs/index.vue: หน้าตรวจสอบกิจกรรม (Logs) ของระบบ
pages/profile/my-vehicles.vue: หน้าสำหรับให้สมาชิกเพิ่มหรือลบข้อมูลรถของตัวเอง
[Modified] Components & Layouts:
components/AdminSidebar.vue: เพิ่มเมนู "Vehicle Management" และ "System Logs" พร้อมจัดการ State การเปิด-ปิด
components/Navbar.vue: เพิ่ม Dropdown Menu ในหน้าหลักสำหรับเข้าสู่หน้าจัดการข้อมูลส่วนตัว (Profile) และปุ่ม Logout
[Modified] Infrastructure & Config:
nuxt.config.js: เพิ่มการตั้งค่า runtimeConfig เพื่อเชื่อมต่อ API ตาม Environment
plugins/api.client.js: ปรับปรุงการ Fetch ข้อมูลโดยใส่ออกเทนติเคชันโทเค็น (JWT) ใน Header ทุกครั้ง
3. Database & DevOps
การจัดการโครงสร้างฐานข้อมูลและ Docker:

[Added] Database Migrations/Scripts:
src/main/resources/db/migration/: เพิ่ม SQL Scripts สำหรับสร้างตาราง vehicles และ user_verifications
[Modified] Docker Configuration:
docker-compose.yml: ปรับปรุงคอนฟิกให้ Frontend และ Backend สามารถสื่อสารกันได้ภายใน Network เดียวกัน และตั้งค่า Environment Variables ให้ชัดเจน
Dockerfile (Backend): ปรับปรุงขั้นตอนการ Build JAR ไฟล์ และการจัดการ Healthcheck ของฐานข้อมูล MySQL
[Summary of Technical Impact]
Full-Stack Connectivity: เชื่อมโยงข้อมูลจาก UI ไปยัง DB ผ่าน REST API ได้อย่างสมบูรณ์ในส่วนของพาหนะ
State Consistency: ข้อมูล User ที่ล็อคอินจะถูกเก็บไว้ใน Cookie และใช้ Sync ระหว่างหน้าต่างได้อย่างสม่ำเสมอ
Expanded Admin Capability: ผู้ดูแลระบบสามารถเข้าถึงข้อมูลเชิงลึกได้มากขึ้นผ่านเมนูที่เพิ่มเข้ามาใหม่