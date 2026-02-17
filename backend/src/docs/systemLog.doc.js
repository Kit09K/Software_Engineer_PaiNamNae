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
 *
 * /system-logs:
 * get:
 * summary: "ดึงรายการ Logs ทั้งหมดสำหรับแอดมิน (Compliance & Audit)"
 * description: "เข้าถึงได้เฉพาะแอดมินเท่านั้น ใช้สำหรับตรวจสอบกิจกรรมย้อนหลังตามกฎหมายและ PDPA"
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
 * '200':
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
 * '401':
 * $ref: '#/components/responses/Unauthorized'
 * '403':
 * $ref: '#/components/responses/Forbidden'
 *
 * /system-logs/{id}:
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
 * '200':
 * description: "ดึงข้อมูลสำเร็จ"
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/SystemLog'
 */