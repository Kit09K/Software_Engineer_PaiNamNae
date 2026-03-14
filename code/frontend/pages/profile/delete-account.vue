<template>
    <div>
        <div class="flex items-center justify-center py-8">
            <div class="flex bg-white rounded-lg shadow-lg overflow-hidden max-w-6xl w-full mx-4 border border-gray-300">
                
                <!-- Sidebar ส่วนโปรไฟล์ (Component ของคุณ) -->
                <ProfileSidebar />

                <main class="flex-1 p-8">
                    <div>
                        <div class="mb-8 text-center">
                            <div class="inline-flex items-center justify-center w-16 h-16 mb-4 bg-red-600 rounded-full">
                                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                            </div>
                            <h1 class="mb-2 text-3xl font-bold text-gray-800">ลบข้อมูลบัญชี</h1>
                            <p class="max-w-md mx-auto text-gray-600">ลบข้อมูลของคุณเมื่อคุณไม่ต้องการใช้งานระบบอีกต่อไป</p>
                        </div>

                        <div class="p-6 bg-white border border-gray-300 shadow rounded-xl">
                            <div class="p-8 max-w-2xl mx-auto">
                                <!-- ส่วนแจ้งเตือนผลกระทบ -->
                                <div class="p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-900 text-sm mb-6">
                                    <h3 class="font-bold mb-1">สิ่งที่จะเกิดขึ้นหลังจากลบข้อมูล:</h3>
                                    <ul class="list-disc list-inside space-y-1">
                                        <li>โปรไฟล์และข้อมูลส่วนตัวทั้งหมดจะถูกลบออกจากฐานข้อมูล</li>
                                        <li>คุณจะสูญเสียสิทธิ์ในการเข้าถึงบริการทั้งหมดที่ผูกกับบัญชีนี้</li>
                                        <li>รายการที่ลบไปแล้ว <strong>ไม่สามารถกู้คืน (Undo)</strong> ได้ในทุกกรณี</li>
                                        <li>ระบบจะส่งรายงานการลบข้อมูลไปยังอีเมลของคุณเพื่อเป็นหลักฐาน</li>
                                        <li>คุณจะไม่สามารถสมัครบัญชีใหม่ด้วย Email ของบัญชีนี้ได้<strong>ภายในระยะเวลา 90 วัน</strong></li>
                                    </ul>
                                </div>

                                <h1 class="text-2xl font-semibold text-gray-900 mb-6">กฏหมาย พ.ร.บ.คอมพิวเตอร์ เกี่ยวกับการลบข้อมูล</h1>

                                <!-- พื้นที่แสดงข้อความกฎหมาย -->
                                <div class="relative border border-gray-300 rounded-lg p-6 mb-6 bg-gray-50 flex-1">
                                    <div class="overflow-y-auto text-base text-gray-700 leading-relaxed whitespace-pre-line text-left max-h-[400px]">
                                        {{ policyText }}
                                    </div>
                                </div>

                                <div v-if="!canDeleteFlag" class="p-4 bg-red-100 border-l-4 border-red-600 text-red-800 text-sm mb-4">
                                    <p class="font-bold">ไม่สามารถลบข้อมูลบัญชีได้เนื่องจาก:</p>
                                    <p class="mt-1">{{ statusErrorMessage }}</p>
                                    <p class="mt-2 font-medium">** กรุณาดำเนินการให้เสร็จสิ้นก่อนทำรายการลบ **</p>
                                </div>

                                <div v-if="canDeleteFlag" class="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm mb-4">
                                    <p>* โปรดกดรับทราบเพื่อยืนยันการลบข้อมูล *</p>
                                </div>

                                <!-- Checkbox รับทราบ (สี่เหลี่ยมตามสั่ง) -->
                                <div class="space-y-6">
                                    <label 
                                        class="flex items-center space-x-3 transition-opacity"
                                        :class="canDeleteFlag ? 'cursor-pointer group' : 'cursor-not-allowed opacity-50'"
                                    >
                                        <div 
                                            class="w-6 h-6 border-2 border-gray-400 rounded-md flex items-center justify-center bg-white transition-colors"
                                            :class="canDeleteFlag ? 'group-hover:border-blue-500' : ''"
                                        >
                                            <input 
                                                type="checkbox" 
                                                class="sr-only peer" 
                                                v-model="isAgreed"
                                                :disabled="!canDeleteFlag"
                                            >
                                            <svg class="w-4 h-4 text-blue-600 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                                            </svg>
                                        </div>
                                        <span class="text-lg font-medium text-gray-800">รับทราบและยอมรับเงื่อนไข</span>
                                    </label>
                                </div>

                                <!-- ปุ่มกดเพื่อขอ OTP -->
                                <div class="flex flex-col items-end mt-12">
                                    <button 
                                        @click="handleRequestOTP"
                                        :disabled="isLoading || !isAgreed || !canDeleteFlag"
                                        class="bg-red-700 text-white px-10 py-2 rounded-md font-semibold hover:bg-red-800 transition-colors shadow-md text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {{ isLoading ? 'กำลังประมวลผล...' : 'ลบ' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <!-- Modal กรอก OTP -->
            <div v-if="showConfirmModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto px-4">
                <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-gray-200">
                    <h2 class="text-xl font-bold text-center text-gray-900 mb-4">ยืนยันการลบข้อมูล</h2>
                    <p class="text-sm text-center text-gray-600 mb-4">
                        ระบบได้ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว โปรดกรอกรหัส <span class="font-bold text-red-600">6 หลัก</span> เพื่อยืนยัน
                    </p>
                    
                    <input 
                        type="text" 
                        v-model="OTPInput"
                        placeholder="xxxxxx"
                        maxlength="6"
                        class="w-full border border-gray-300 rounded-md px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                    />

                    <div class="text-center mb-6">
                        <button @click="sendOTPOnly" :disabled="isSendingOTP" class="text-sm text-blue-600 hover:underline disabled:text-gray-400">
                            {{ isSendingOTP ? 'กำลังส่ง...' : 'ส่งรหัส OTP อีกครั้ง' }}
                        </button>
                    </div>
        
                    <div class="flex justify-between space-x-3">
                        <button @click="closeModal" class="flex-1 bg-gray-400 text-white py-2 rounded-md font-bold hover:bg-gray-500 transition-colors">ยกเลิก</button>
                        <button 
                            @click="verifyAndDestroy"
                            :disabled="OTPInput.length !== 6 || isLoading"
                            class="flex-1 bg-blue-600 text-white py-2 rounded-md font-bold hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                        >ยืนยัน</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// --- State Variables ---
const isAgreed = ref(false)
const isLoading = ref(false)
const isSendingOTP = ref(false)
const showConfirmModal = ref(false)
const OTPInput = ref('')

const canDeleteFlag = ref(true)
const statusErrorMessage = ref('')

const config = useRuntimeConfig()
const apiBase = config.public.apiBase

// ดึง Token จาก Cookie หรือ Store ที่คุณใช้ (ตัวอย่างใช้ useCookie/localStorage)
const getUserToken = () => {
    const token = useCookie('token').value;
    return token;
}

// --- API Functions ---

// 1. เช็คก่อนลบได้ไหม (เรียกเมื่อเปิดหน้า)
const checkCanDelete = async () => {
    try {
        const res = await $fetch(`${apiBase}/delete-request/check-can-delete`, {
            headers: { Authorization: `Bearer ${getUserToken()}` }
        })
        canDeleteFlag.value = res.canDelete
        if (!res.canDelete) {
            statusErrorMessage.value = res.message
        }
    } catch (error) {
        console.error("Eligibility check failed", error)
    }
}

// 2. ส่ง OTP และเปิด Modal
const handleRequestOTP = () => {
    if (!isAgreed.value || !canDeleteFlag.value) return;

    showConfirmModal.value = true;
    OTPInput.value = '';

    // สั่งส่ง OTP ใน Background (ไม่ต้องใช้ await ขวางการเปิดหน้าต่าง)
    isSendingOTP.value = true;
    $fetch(`${apiBase}/otp/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getUserToken()}` }
    })
    .then((res) => {
        if (res.success) {
            console.log("OTP sent in background");
        }
    })
    .catch((error) => {
        console.error("Failed to send OTP", error);
        // หากส่งไม่สำเร็จจริงๆ อาจจะแจ้งเตือนใน Modal หรือให้กด Send Again
    })
    .finally(() => {
        isSendingOTP.value = false;
    });
}

// 3. ฟังก์ชันส่ง OTP ซ้ำใน Modal
const sendOTPOnly = async () => {
    isSendingOTP.value = true
    try {
        await $fetch(`${apiBase}/otp/send`, { 
            method: 'POST', 
            headers: { Authorization: `Bearer ${getUserToken()}` } 
        })
    } finally {
        isSendingOTP.value = false
    }
}

// 4. ขั้นตอนสุดท้าย: ยืนยัน OTP และ ทำการ Soft Delete
const verifyAndDestroy = async () => {
    isLoading.value = true
    try {
        // Step A: Verify OTP
        const verify = await $fetch(`${apiBase}/otp/verify`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${getUserToken()}` },
            body: { otpCode: OTPInput.value }
        })

        if (verify.success) {
            // Step B: ยิง API ลบข้อมูล (Soft Delete ซึ่งลบทันทีในฝั่งผู้ใช้)
            const deleteRes = await $fetch(`${apiBase}/delete-request`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${getUserToken()}` },
                body: {
                    deleteUserRequest: true,
                    deleteVehicleRequest: true,
                    deleteRouteRequest: true,
                    deleteBookingRequest: true
                }
            })

            if (deleteRes.success) {
                alert('ลบข้อมูลบัญชีของคุณเสร็จสิ้นเรียบร้อยแล้ว')
                
                // เรียกใช้ฟังก์ชัน Logout เพื่อบังคับเด้งออกทันที
                forceLogout() 
            }
        }
    } catch (error) {
        alert(error.data?.message || 'รหัส OTP ไม่ถูกต้องหรือเกิดข้อผิดพลาด')
    } finally {
        isLoading.value = false
    }
}

const forceLogout = () => {
    // 1. ล้างข้อมูลใน LocalStorage ทั้งหมดที่เกี่ยวกับ User
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    // 2. ล้างข้อมูลใน Cookie
    const tokenCookie = useCookie('token')
    tokenCookie.value = null 
    const userCookie = useCookie('user') // เผื่อคุณมีการเก็บ user ไว้ใน cookie ด้วย
    userCookie.value = null 

    // 3. (Optional) หากคุณใช้ Pinia จัดการ State ให้ทำการรีเซ็ตค่าตรงนี้ด้วย
    // const authStore = useAuthStore()
    // authStore.$reset()

    // 4. บังคับเด้งกลับไปที่หน้าหลัก หรือหน้า Login
    window.location.href = '/' // หรือเปลี่ยนเป็น '/login' ตามความเหมาะสม
}

// ล้างค่าเมื่อปิด Modal
const closeModal = () => {
    showConfirmModal.value = false
    OTPInput.value = ''
}

onMounted(() => {
    checkCanDelete()
})

const policyText = `พ.ร.บ.คอมพิวเตอร์ฯ เกี่ยวกับการลบข้อมูล

ครอบคลุมทั้งการห้ามลบข้อมูลผู้อื่นโดยมิชอบ (ทำลาย/แก้ไข) ตามมาตรา 9-10 
และการบังคับลบข้อมูลที่ผิดกฎหมายตามคำสั่งศาล/เจ้าหน้าที่ (มาตรา 20) 
โดยผู้ให้บริการต้องลบเนื้อหาผิดกฎหมายภายใน 24 ชม. - 7 วันตามประเภทความผิด

ความผิดฐานลบข้อมูลผู้อื่น (มาตรา 9 และ 10):
	1. ห้ามทำลายหรือแก้ไขข้อมูลของผู้อื่น (ม.9): 
	ถ้าใคร ลบข้อมูล แก้ไข เปลี่ยนแปลง เพิ่มเติม ทำให้ข้อมูลเสียหาย โดยไม่ได้รับอนุญาต
	โทษ: จำคุกไม่เกิน 5 ปี หรือปรับไม่เกิน 100,000 บาท หรือทั้งจำทั้งปรับ
	2. ห้ามรบกวนระบบคอมพิวเตอร์ของผู้อื่น (ม.10): 
	ถ้าใครทำให้ระบบของผู้อื่นทำงานช้าลง ใช้งานไม่ได้ ระบบล่ม ด้วยวิธีทางอิเล็กทรอนิกส์โดยมิชอบ
	โทษ: จำคุกไม่เกิน 5 ปี หรือปรับไม่เกิน 100,000 บาท หรือทั้งจำทั้งปรับ

การบังคับลบข้อมูลที่ผิดกฎหมาย (มาตรา 20):
	เมื่อมีคำสั่งศาลให้ลบข้อมูล พนักงานเจ้าหน้าที่หรือผู้ให้บริการ (Service Provider) ต้องดำเนินการลบหรือทำให้ข้อมูลนั้นเผยแพร่ไม่ได้ทันที
	ตามประกาศกระทรวงดิจิทัลฯ ปี 2565 กำหนดระยะเวลาไว้ดังนี้:
	- ภายใน 24 ชั่วโมง: ข้อมูลลามกอนาจาร, ข้อมูลเกี่ยวกับความมั่นคง/ก่อการร้าย, หรือกรณีบุคคลทั่วไปร้องเรียน
	- ภายใน 3 วัน: ข้อมูลที่ผิดมาตรา 14 (4) (ข้อมูลลามกที่ประชาชนเข้าถึงได้)
	- ภายใน 7 วัน: ข้อมูลที่ผิดมาตรา 14 (1) (ข้อมูลปลอม, เท็จ)

การฝ่าฝืนคำสั่ง (มาตรา 16/2):
	หากผู้ใดรู้ว่าข้อมูลคอมพิวเตอร์ในครอบครองเป็นสิ่งที่ศาลสั่งให้ทำลาย (เช่น ข้อมูลที่ละเมิดสิทธิ) แล้วฝ่าฝืนไม่ลบ/ไม่ทำลาย ต้องระวางโทษกึ่งหนึ่งของโทษในมาตรา 14 หรือ 16 แล้วแต่กรณี

การลบข้อมูลของตนเอง: สามารถทำได้ตามสิทธิ ยกเว้นเป็นการลบเพื่อทำลายหลักฐานที่เกี่ยวข้องกับการกระทำความผิดที่กำลังถูกดำเนินคดี`

</script>

<style scoped>
.fixed { animation: fadeIn 0.2s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
</style>