# Test Design: Story 1 Logs

## TC-LOG-001: Admin เข้าถึงหน้า System Logs ได้
- Role: Admin
- Preconditions: Login สำเร็จ
- Steps:
  1. เข้าสู่ระบบด้วย Admin
  2. ไปที่ Dashboard
  3. ไปที่เมนู System Logs
- Expected Result:
  - แสดงหน้า "System Logs (บันทึกกิจกรรมระบบ)"

---

## TC-LOG-002: Non-admin ไม่สามารถเข้าถึง Dashboard
- Role: Normal User
- Preconditions: Login สำเร็จ
- Steps:
  1. Login ด้วย user ปกติ
  2. เปิดเมนู profile
- Expected Result:
  - ไม่พบเมนู Dashboard

---

## TC-LOG-003: ค้นหา Logs ตามวันที่
- Role: Admin
- Steps:
  1. เลือกวันที่เริ่มต้น = 03/03/2026
  2. เลือกวันที่สิ้นสุด = 03/03/2026
  3. กด Search
- Expected Result:
  - แสดงข้อมูลวันที่ "03 มี.ค. 2569"

---

## TC-LOG-004: ตรวจสอบ Date Range Filter
- Role: Admin
- Steps:
  1. เลือกช่วงวันที่ 03/03/2026
  2. กด Search
- Expected Result:
  - ไม่พบข้อมูลวันที่ "04 มี.ค. 2569"

---

## TC-LOG-005: Filter ตาม Action
- Role: Admin
- Steps:
  1. เลือก Action = VIEW_DATA
  2. กด Search
- Expected Result:
  - แสดงเฉพาะ VIEW_DATA
  - ไม่พบข้อความ login success

---

## TC-LOG-006: Select All Export
- Role: Admin
- Steps:
  1. กด Export
  2. กด Select All
- Expected Result:
  - แสดง "ยืนยันการ Export (9)"

---

## TC-LOG-007: เลือก Export บางรายการ
- Role: Admin
- Steps:
  1. เลือก checkbox 2 รายการ
- Expected Result:
  - แสดง "ยืนยันการ Export (2)"

---

## TC-LOG-008: Export file สำเร็จ
- Role: Admin
- Steps:
  1. ค้นหา user tester2
  2. กด Export
  3. กด Select All
  4. กด Confirm
- Expected Result:
  - มีการดาวน์โหลดไฟล์สำเร็จ

---

# Test Design: Story 12 Notification

---

## TC-UAT-01: Driver ส่ง Notification สำเร็จ
- Role: Driver
- Preconditions:
  - Driver login สำเร็จ
  - มี route ที่ active
- Steps:
  1. ไปหน้า Driver Route
  2. กด "แจ้งเตือนผู้โดยสาร"
  3. เลือกข้อความแจ้งเตือน
  4. กดส่ง
- Expected Result:
  - แสดงข้อความ "ส่งข้อความสำเร็จ"

---

## TC-UAT-02: Passenger ได้รับ Notification
- Role: Driver, Passenger
- Preconditions:
  - Driver และ Passenger login สำเร็จ
- Steps:
  1. Driver ส่ง notification
  2. Passenger เปิด notification panel
- Expected Result:
  - แสดง notification ใหม่
  - มีข้อความ "just now"

---

## TC-UAT-03: Notification แสดงข้อมูลถูกต้อง
- Role: Driver, Passenger
- Steps:
  1. Driver ส่งข้อความแจ้งเตือน
  2. Passenger เปิด notification
- Expected Result:
  - แสดงข้อความ "กำลังหาที่จอดรถครับ"
  - แสดงชื่อผู้ส่ง (Jane Doe)

---

## TC-UAT-04: Passenger ตอบกลับข้อความ
- Role: Passenger
- Steps:
  1. Passenger เปิด chat
  2. กด acknowledge
  3. กดส่งข้อความกลับ
- Expected Result:
  - ระบบส่งข้อความกลับสำเร็จ (ไม่มี error)

---

## TC-UAT-05: Driver ได้รับข้อความตอบกลับ
- Role: Driver, Passenger
- Steps:
  1. Driver ส่ง notification
  2. Passenger ตอบกลับ
  3. Driver เปิด notification
- Expected Result:
  - Driver เห็นข้อความตอบกลับ เช่น "โอเคครับ"

---

## TC-UAT-06: Passenger ปิด Notification Permission
- Role: Passenger
- Preconditions:
  - Browser ปิด notification permission
- Steps:
  1. Driver ส่ง notification
  2. Passenger เปิด notification panel ภายในระบบ
- Expected Result:
  - ยังสามารถเห็น notification ในระบบได้
  - แสดงข้อความ "just now"

---

# Test Design: Story 16 Deletion

---

## TC-DEL-01: ผู้ใช้สามารถกดปุ่มลบได้เมื่อยอมรับเงื่อนไข
- Role: User
- Preconditions:
  - Login สำเร็จ
- Steps:
  1. ไปหน้า "ลบข้อมูลบัญชี"
  2. เลือก checkbox ยอมรับเงื่อนไข
- Expected Result:
  - Checkbox ถูกเลือก
  - ปุ่ม "ลบข้อมูลบัญชี" ถูก enable

---

## TC-DEL-02: ไม่สามารถกดลบได้หากไม่ยอมรับเงื่อนไข
- Role: User
- Steps:
  1. ไปหน้า "ลบข้อมูลบัญชี"
- Expected Result:
  - Checkbox ไม่ถูกเลือก
  - ปุ่มลบถูก disable

---

## TC-DEL-03: Checkbox backup สามารถเลือก/ยกเลิกได้
- Role: User
- Steps:
  1. เลือก checkbox ทุกตัว (profile, car, route, reserve)
  2. ยกเลิกการเลือกทั้งหมด
- Expected Result:
  - สามารถ select/unselect ได้ทุกตัว

---

## TC-DEL-04: Checkbox บางตัวถูก disable
- Role: User
- Steps:
  1. ไปหน้า delete account
- Expected Result:
  - Checkbox (เช่น car) ถูก disable และไม่สามารถเลือกได้

---

## TC-DEL-05: ยกเลิก OTP
- Role: User
- Steps:
  1. กด request delete
  2. ระบบแสดง OTP dialog
  3. กดยกเลิก
- Expected Result:
  - OTP ไม่ถูกใช้งาน
  - ไม่มีข้อความ OTP success

---

## TC-DEL-06: ใส่ OTP ผิด
- Role: User
- Steps:
  1. Request OTP
  2. ใส่ OTP ผิด
- Expected Result:
  - ระบบไม่ลบบัญชี
  - แสดง error / ไม่สำเร็จ

---

## TC-DEL-07: OTP หมดอายุ
- Role: User
- Steps:
  1. Request OTP
  2. รอเกินเวลาที่กำหนด
  3. Submit OTP
- Expected Result:
  - OTP ไม่สามารถใช้งานได้
  - ไม่ลบบัญชี

---

## TC-DEL-08: ลบบัญชีสำเร็จ
- Role: User
- Steps:
  1. Request OTP
  2. Submit OTP ถูกต้อง
- Expected Result:
  - บัญชีถูกลบสำเร็จ

---

## TC-DEL-09: ลบแล้วไม่สามารถ login ได้
- Role: User
- Steps:
  1. ลบบัญชีสำเร็จ
  2. พยายาม login อีกครั้ง
- Expected Result:
  - Login ไม่สำเร็จ

---

## TC-DEL-10: ไม่สามารถลบบัญชีที่มี route
- Role: User (มี route อยู่)
- Steps:
  1. ไปหน้า delete account
- Expected Result:
  - ระบบแสดงข้อความ:
    "ไม่สามารถลบข้อมูลบัญชีได้เนื่องจาก..."