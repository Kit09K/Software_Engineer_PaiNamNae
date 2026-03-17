# Test Design: Story 1 System Logs API

Base URL: /api/system-logs

---

# GROUP 1: Get Logs (GET /api/system-logs)

## TC-GL-001: ดึง logs ทั้งหมด (default)
- Preconditions: Admin login สำเร็จ
- Steps:
  1. เรียก API โดยไม่ใส่ parameter
- Expected Result:
  - Status = 200
  - success = true
  - มี data และ pagination
  - pagination มี page, limit, totalPages, totalResults

---

## TC-GL-002: Pagination ทำงานถูกต้อง
- Steps:
  1. ส่ง page=1, limit=10
- Expected Result:
  - page = 1
  - limit = 10
  - จำนวน data ≤ 10

---

## TC-GL-003: Filter ด้วย level = INFO
- Steps:
  1. ส่ง level=INFO
- Expected Result:
  - ทุก record มี level = INFO

---

## TC-GL-004: Filter ด้วย level = WARNING
- Expected Result:
  - ทุก record มี level = WARNING

---

## TC-GL-005: Filter ด้วย level = ERROR
- Expected Result:
  - ทุก record มี level = ERROR

---

## TC-GL-006: Filter ด้วย action
- Steps:
  1. ส่ง action=LOGIN
- Expected Result:
  - ทุก record มี action = LOGIN

---

## TC-GL-007: Filter ด้วย resource
- Steps:
  1. ส่ง resource=User
- Expected Result:
  - ระบบไม่ error และ success = true

---

## TC-GL-008: Filter ด้วย date range
- Steps:
  1. ส่ง startDate และ endDate
- Expected Result:
  - success = true

---

## TC-GL-009: Filter ด้วย date + time range
- Expected Result:
  - success = true

---

## TC-GL-010: Search ด้วย IP
- Steps:
  1. ส่ง search=127.0.0.1
- Expected Result:
  - success = true

---

## TC-GL-011: Search ด้วย username
- Steps:
  1. ส่ง search=admin
- Expected Result:
  - success = true

---

## TC-GL-012: Search ด้วย whitespace
- Expected Result:
  - ระบบไม่ crash
  - success = true

---

## TC-GL-013: ไม่มี token
- Expected Result:
  - Status = 401

---

## TC-GL-014: ใช้ filter หลายตัวพร้อมกัน
- Expected Result:
  - success = true
  - filter ทำงานร่วมกันได้

---

# GROUP 2: Get Log By ID (GET /api/system-logs/:id)

## TC-GI-001: ดึง log ด้วย ID ที่ถูกต้อง
- Steps:
  1. ใช้ ID ที่มีอยู่
- Expected Result:
  - Status = 200
  - id ตรงกับที่ request
  - มี field action, level, resource, timestamp

---

## TC-GI-002: ID ไม่มีในระบบ
- Expected Result:
  - Status = 404

---

## TC-GI-003: ไม่มี token
- Expected Result:
  - Status = 401

---

# GROUP 3: Export Logs (GET /api/system-logs/export)

## TC-EX-001: Export ทั้งหมด
- Expected Result:
  - Status = 200
  - Content-Type = application/json
  - มี header X-File-SHA256 (64 chars)
  - มี metadata และ data

---

## TC-EX-002: Export แบบ filter
- Steps:
  1. ส่ง level=WARNING
- Expected Result:
  - ทุก record เป็น WARNING

---

## TC-EX-003: Export ด้วย date range
- Expected Result:
  - recordCount ≥ 0

---

## TC-EX-004: Filename ถูกต้อง
- Expected Result:
  - Content-Disposition มี:
    - attachment
    - painamnae_logs_
    - .json

---

## TC-EX-005: ไม่มี token
- Expected Result:
  - Status = 401

---

## TC-EX-006: recordCount ตรงกับจำนวน data
- Expected Result:
  - metadata.recordCount == len(data)

---

## TC-EX-007: Filter ถูกบันทึกใน metadata
- Expected Result:
  - filtersApplied ตรงกับ request

---

# GROUP 4: Delete Old Logs (DELETE /api/system-logs/old-logs)

## TC-DL-001: ลบ logs สำเร็จ
- Expected Result:
  - Status = 200
  - success = true
  - มี data.count

---

## TC-DL-002: count เป็นค่าถูกต้อง
- Expected Result:
  - count ≥ 0

---

## TC-DL-003: ไม่มี token
- Expected Result:
  - Status = 401

---

## TC-DL-004: user ไม่ใช่ admin
- Expected Result:
  - Status = 403

---

# Test Design: Story 12 Push Notification API

Base URL: /api/push-notifications

---

# GROUP 1: Subscribe (POST /subscribe)

## TC-SUB-001: Subscribe สำเร็จ
- Role: Passenger
- Preconditions:
  - มี token ถูกต้อง
- Steps:
  1. ส่ง subscription payload ที่ถูกต้อง
- Expected Result:
  - Status = 201
  - success = true

---

## TC-SUB-002: Subscribe ไม่มี token
- Steps:
  1. ส่ง request โดยไม่ใส่ Authorization
- Expected Result:
  - Status = 401
  - message = Not authorized, no token

---

## TC-SUB-003: Subscribe payload ไม่ถูกต้อง
- Steps:
  1. ส่ง subscription เป็นค่าว่าง
- Expected Result:
  - Status = 400
  - error = Invalid subscription data

---

# GROUP 2: Send Push Notification (POST /send)

## TC-PUSH-001: ส่ง notification สำเร็จ
- Role: Driver
- Steps:
  1. ส่ง targetUserId, title, body
- Expected Result:
  - Status = 200
  - success = true

---

## TC-PUSH-002: ส่งไม่ครบ field
- Steps:
  1. ไม่ส่ง title
- Expected Result:
  - Status = 400
  - error = Missing targetUserId or title

---

## TC-PUSH-003: ส่งไป user ที่ไม่มี subscription
- Steps:
  1. ใช้ invalid user id
- Expected Result:
  - Status = 404
  - message = No subscriptions found for this user

---

# GROUP 3: Notify Pickup (POST /notify-pickup)

## TC-NOTI-001: แจ้งเตือนรับผู้โดยสารสำเร็จ
- Role: Driver
- Preconditions:
  - booking เป็นของ driver คนนี้
- Steps:
  1. ส่ง bookingId ที่ถูกต้อง
- Expected Result:
  - Status = 200
  - success = true
  - data.type = BOOKING

---

## TC-NOTI-002: driver ไม่มีสิทธิ์
- Steps:
  1. ใช้ booking ของคนอื่น
- Expected Result:
  - Status = 403
  - error = Unauthorized

---

## TC-NOTI-003: booking ไม่พบ
- Steps:
  1. ใช้ bookingId ปลอม
- Expected Result:
  - Status = 404
  - error = Booking not found

---

# Test Design: Story 16 Delete Request & OTP Flow

---

# GROUP 1: Check Delete Information

## TC-DEL-001: ตรวจสอบข้อมูลก่อนลบ
- Role: User
- Preconditions:
  - สมัครสมาชิกสำเร็จ
  - login แล้ว
- Steps:
  1. เรียก API /api/delete-request/check-infos
- Expected Result:
  - Status = 200
  - มี field:
    - user
    - vehicles
    - routes
    - bookings

---

# GROUP 2: Check Can Delete

## TC-DEL-002: ตรวจสอบว่าสามารถลบได้
- Steps:
  1. เรียก API /check-can-delete
- Expected Result:
  - Status = 200
  - มี field canDelete

---

# GROUP 3: OTP

## TC-OTP-001: ส่ง OTP สำเร็จ
- Steps:
  1. เรียก /api/otp/send
- Expected Result:
  - Status = 200
  - success = true

---

## TC-OTP-002: Verify OTP สำเร็จ
- Preconditions:
  - ได้ OTP จากระบบ
- Steps:
  1. ส่ง otpCode
- Expected Result:
  - Status = 200
  - success = true

---

# GROUP 4: Delete Request

## TC-DEL-003: ส่งคำขอลบข้อมูล (Soft Delete)
- Steps:
  1. ส่ง request:
     - deleteUserRequest = true
     - deleteVehicleRequest = true
     - deleteRouteRequest = true
     - deleteBookingRequest = true
- Expected Result:
  - Status = 200
  - success = true

---

# GROUP 5: Cleanup

## TC-DEL-004: Admin ลบ user ออกจากระบบ
- Role: Admin
- Steps:
  1. login เป็น admin
  2. ลบ user ด้วย userId
- Expected Result:
  - ระบบลบ user สำเร็จ (หรือไม่ error)