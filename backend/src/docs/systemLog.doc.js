/**
 * @swagger
 * components:
 * schemas:
 * SystemLog:
 * type: object
 * properties:
 * id:
 * type: string
 * example: "cln1234567890"
 * timestamp:
 * type: string
 * format: date-time
 * description: "วันและเวลาที่เกิดเหตุการณ์ (ตาม พ.ร.บ. คอมพิวเตอร์)"
 * userId:
 * type: string
 * nullable: true
 * example: "user_uuid_123"
 * action:
 * type: string
 * enum: [LOGIN, LOGOUT, ACCESS_SENSITIVE_DATA, CREATE_DATA, UPDATE_DATA, DELETE_DATA, APPROVE_VERIFICATION, REJECT_VERIFICATION, SOS_TRIGGERED]
 * level:
 * type: string
 * enum: [INFO, WARNING, ERROR, CRITICAL]
 * description: "ระดับความรุนแรงของ Log"
 * example: "INFO"
 * resource:
 * type: string
 * description: "โมดูลหรือระบบที่เกิดเหตุการณ์"
 * example: "User"
 * ipAddress:
 * type: string
 * example: "171.100.x.x"
 * userAgent:
 * type: string
 * example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
 * targetTable:
 * type: string
 * example: "User"
 * targetId:
 * type: string
 * example: "target_uuid_456"
 * details:
 * type: object
 * description: "รายละเอียดเพิ่มเติมในรูปแบบ JSON"
 * example: { "status": "SUCCESS", "fields": ["phoneNumber"] }
 * errorMessage:
 * type: string
 * nullable: true
 * description: "ข้อความ Error กรณีเกิดข้อผิดพลาด"
 * * tags:
 * name: SystemLogs
 * description: System Log endpoints for admin auditing and compliance
 *
 * /api/system-logs:
 * get:
 * summary: "ดึงรายการ Logs ทั้งหมดสำหรับแอดมิน (SELECT & Filter)"
 * description: "เข้าถึงได้เฉพาะแอดมินเท่านั้น ใช้สำหรับตรวจสอบกิจกรรมย้อนหลังตามกฎหมายและ PDPA (BUSINESS LOGIC no.2 & no.5)"
 * tags: [SystemLogs]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: query
 * name: action
 * schema:
 * type: string
 * description: "กรองตามประเภทกิจกรรม"
 * - in: query
 * name: userId
 * schema:
 * type: string
 * description: "กรองตาม ID ของผู้ใช้งาน"
 * - in: query
 * name: level
 * schema:
 * type: string
 * enum: [INFO, WARNING, ERROR, CRITICAL]
 * description: "กรองตามระดับความรุนแรง"
 * - in: query
 * name: resource
 * schema:
 * type: string
 * description: "กรองตามโมดูล (เช่น User, Route, Booking)"
 * - in: query
 * name: startDate
 * schema:
 * type: string
 * format: date
 * description: "วันที่เริ่มต้น (YYYY-MM-DD)"
 * - in: query
 * name: endDate
 * schema:
 * type: string
 * format: date
 * description: "วันที่สิ้นสุด (YYYY-MM-DD)"
 * - in: query
 * name: page
 * schema:
 * type: integer
 * default: 1
 * - in: query
 * name: limit
 * schema:
 * type: integer
 * default: 50
 * responses:
 * 200:
 * description: "ดึงข้อมูลสำเร็จ"
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success:
 * type: boolean
 * data:
 * type: array
 * items:
 * $ref: '#/components/schemas/SystemLog'
 * pagination:
 * type: object
 * properties:
 * totalResults:
 * type: integer
 * totalPages:
 * type: integer
 * 401:
 * description: "Unauthorized"
 * 403:
 * description: "Forbidden (Admin only)"
 *
 * /api/system-logs/export:
 * get:
 * summary: "Export Logs เป็นไฟล์ JSON (logs_export)"
 * description: "ส่งออกข้อมูล Log ตามเงื่อนไขการ Filter ให้อยู่ในรูปแบบไฟล์ JSON (BUSINESS LOGIC no.1)"
 * tags: [SystemLogs]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: query
 * name: action
 * schema:
 * type: string
 * - in: query
 * name: userId
 * schema:
 * type: string
 * - in: query
 * name: level
 * schema:
 * type: string
 * - in: query
 * name: resource
 * schema:
 * type: string
 * - in: query
 * name: startDate
 * schema:
 * type: string
 * format: date
 * - in: query
 * name: endDate
 * schema:
 * type: string
 * format: date
 * responses:
 * 200:
 * description: "ดาวน์โหลดไฟล์ JSON สำเร็จ"
 * content:
 * application/json:
 * schema:
 * type: string
 * format: binary
 * 401:
 * description: "Unauthorized"
 * 403:
 * description: "Forbidden (Admin only)"
 *
 * /api/system-logs/old-logs:
 * delete:
 * summary: "ลบ Logs ที่มีอายุเกิน 90 วัน (del_morethan90_log)"
 * description: "ล้างข้อมูลเก่าในฐานข้อมูลเพื่อลดขนาดพื้นที่เก็บข้อมูล (BUSINESS LOGIC no.3)"
 * tags: [SystemLogs]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: "ลบข้อมูลสำเร็จ"
 * content:
 * application/json:
 * example:
 * success: true
 * message: "Successfully deleted 150 logs older than 90 days."
 * 401:
 * description: "Unauthorized"
 * 403:
 * description: "Forbidden (Admin only)"
 *
 * /api/system-logs/{id}:
 * get:
 * summary: "ดึงรายละเอียดเชิงลึกของ Log รายการเดียว"
 * tags: [SystemLogs]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * responses:
 * 200:
 * description: "ดึงข้อมูลสำเร็จ"
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/SystemLog'
 */