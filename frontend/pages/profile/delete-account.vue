<template>
    <div >
        <div class=" flex items-center justify-center py-8">
            <div
                class="flex bg-white rounded-lg shadow-lg overflow-hidden max-w-6xl w-full mx-4 border border-gray-300">

                <ProfileSidebar />

                <main class="flex-1 p-8">
                    <div class="p-8 max-w-2xl mx-auto">
                        <!-- หัวข้อหลัก -->
                        <h1 class="text-2xl font-bold text-gray-900 mb-6">
                            เลือกข้อมูลที่คุณต้องการจะลบ
                        </h1>

                        <!-- เส้นคั่นกลาง -->
                        <hr class="border-t border-gray-300 mb-8" />

                        <!-- รายการข้อมูลที่ให้เลือก (Checkbox/Radio List) -->
                        <div class="space-y-6">
                            <!-- เลือกทั้งหมด -->
                            <label class="flex items-center space-x-3 cursor-pointer group">
                                <div class="w-5 h-5 border-2 border-gray-400 rounded-full flex items-center justify-center group-hover:border-blue-500 transition-colors">
                                    <input type="checkbox" class="sr-only peer" v-model="selectAll" @change="toggleAll">
                                    <div class="w-3 h-3 bg-blue-500 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                                </div>
                                <span class="text-lg font-medium text-gray-800">ลบข้อมูลบัญชี</span>
                            </label>

                            <!-- รายการข้อมูลย่อยที่จะลบ -->
                            <div class="ml-4 space-y-4">
                                <label v-for="(item, index) in dataItems" :key="index" class="flex items-center space-x-3 cursor-pointer group">
                                    <div class="w-5 h-5 border-2 border-gray-400 rounded-full flex items-center justify-center group-hover:border-blue-500 transition-colors">
                                        <!-- แก้ไข :value ให้เป็น item.id -->
                                        <input type="checkbox" class="sr-only peer" v-model="selectedItems" :value="item.id">
                                        <div class="w-3 h-3 bg-blue-500 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                                    </div>
                                    <span class="text-gray-800 font-medium">{{ item.name }}</span>
                                </label>
                            </div>

                            <!-- รับรายละเอียดทาง Email -->
                            <label class="flex items-center space-x-3 cursor-pointer group pt-4">
                                <div class="w-5 h-5 border-2 border-gray-400 rounded-full flex items-center justify-center group-hover:border-blue-500 transition-colors">
                                    <input type="checkbox" class="sr-only peer" v-model="sendEmail">
                                    <div class="w-3 h-3 bg-blue-500 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                                </div>
                                <span class="text-gray-700">ต้องการรับรายละเอียดข้อมูลที่ลบทาง Email หรือไม่</span>
                            </label>
                        </div>

                        <!-- ปุ่มลบ -->
                        <div class="flex justify-end mt-12">
                            <button 
                                @click="showConfirmModal = true"
                                :disabled="isLoading || selectedItems.length === 0"
                                class="bg-red-700 text-white px-10 py-2 rounded-md font-semibold hover:bg-red-800 transition-colors shadow-md text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                ลบ
                            </button>
                        </div>
                    </div>
                </main>
            </div>

            <div v-if="showConfirmModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto">
                <div :class="[isExpanded ? 'max-w-4xl w-full h-[80vh]' : 'max-w-sm w-full']" 
                    class="bg-white rounded-2xl shadow-2xl p-8 mx-4 border border-gray-200 pointer-events-auto transition-all duration-300 flex flex-col">
        
                    <h2 class="text-xl font-bold text-center text-gray-900 mb-4">
                        คุณต้องการลบข้อมูลที่เลือกใช่หรือไม่
                    </h2>
        
                    <div class="relative border border-gray-300 rounded-lg p-4 mb-4 bg-gray-50 flex-1 overflow-hidden group">
                        <!-- ปุ่มขยาย (Expand Icon) -->
                        <button @click="isExpanded = !isExpanded" 
                                class="absolute top-2 right-2 p-1 bg-white rounded-md shadow-sm border hover:bg-gray-100 transition-colors z-10">
                            <svg v-if="!isExpanded" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707zm4.344-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707z"/>
                            </svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M.172 15.828a.5.5 0 0 0 .707 0l4.096-4.096V14.5a.5.5 0 1 0 1 0v-3.975a.5.5 0 0 0-.5-.5H1.5a.5.5 0 0 0 0 1h2.768L.172 15.121a.5.5 0 0 0 0 .707zM15.828.172a.5.5 0 0 0-.707 0l-4.096 4.096V1.5a.5.5 0 1 0-1 0v3.975a.5.5 0 0 0 .5.5H14.5a.5.5 0 0 0 0-1h-2.768L15.828.879a.5.5 0 0 0 0-.707z"/>
                            </svg>
                        </button>

                        <!-- พื้นที่ข้อความเลื่อนได้ -->
                        <div class="h-full overflow-y-auto pr-2 text-sm text-gray-700 leading-relaxed whitespace-pre-line text-left"
                            :class="isExpanded ? 'text-base' : 'max-h-32'">
                            {{ policyText }}
                        </div>
                    </div>

                    <p class="text-sm text-center text-gray-600 mb-2">พิมพ์ <span class="font-bold text-red-600">confirm</span> เพื่อยืนยันการลบ</p>
                    
                    <!-- ช่องกรอกข้อความ confirm -->
                    <input 
                        type="text" 
                        v-model="confirmInput"
                        placeholder="confirm"
                        class="w-full border border-gray-300 rounded-md px-4 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                    />
        
                    <div class="flex justify-between space-x-3">
                        <button 
                            @click="closeModal"
                            class="flex-1 bg-gray-400 text-white py-2 rounded-md text-lg font-bold hover:bg-gray-500 transition-colors"
                        >
                            ไม่ใช่
                        </button>
                        <button 
                            @click="confirmDelete"
                            :disabled="confirmInput !== 'confirm'"
                            class="flex-1 bg-[#3B82F6] text-white py-2 rounded-md text-lg font-bold hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                        >
                            ใช่
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'

const selectAll = ref(false)
const selectedItems = ref([]) // เก็บ index หรือ id ของสิ่งที่จะลบ
const sendEmail = ref(false)
const isLoading = ref(false) // เพิ่มสถานะ Loading
const showConfirmModal = ref(false)
const confirmInput = ref('')
const { $api } = useNuxtApp()
const { logout } = useAuth()

// รายละเอียดรายการย่อย (แนะนำว่าในใช้งานจริงควรมี 'id')
const dataItems = ref([
    { id: 1, name: 'ข้อมูลยานพาหนะ' },
    { id: 2, name: 'ข้อมูลเส้นทาง' },
    { id: 3, name: 'ข้อมูลการจอง' },
])

const toggleAll = () => {
    if (selectAll.value) {
        // เก็บเป็น ID เพื่อส่งไปให้ Backend
        selectedItems.value = dataItems.value.map(item => item.id)
    } else {
        selectedItems.value = []
    }
}

watch(selectedItems, (newVal) => {
    if (newVal.length === dataItems.value.length) {
        selectAll.value = true
    } else {
        selectAll.value = false
    }
}, { deep: true })

const openModal = () => {
    confirmInput.value = '' // ล้างค่าเก่าทิ้งก่อนเปิด modal
    showConfirmModal.value = true
}

const closeModal = () => {
    showConfirmModal.value = false
    confirmInput.value = ''
    isExpanded.value = false
}

const isExpanded = ref(false) // ควบคุมการขยายกล่อง
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

const confirmDelete = async () => {
    if (confirmInput.value !== 'confirm') return

    showConfirmModal.value = false
    isLoading.value = true
    
    try {

        const token = useCookie('token').value || (process.client ? localStorage.getItem('token') : '')

        await $api('/delete/account', {

        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: {
            deleteAccount: selectAll.value,
            deleteVehicles: selectedItems.value.includes(1),
            deleteRoutes: selectedItems.value.includes(2),
            deleteBookings: selectedItems.value.includes(3),
            sendEmailCopy: sendEmail.value
        }
    })
        
    if (selectAll.value) {
        logout()
        alert('ลบข้อมูลเรียบร้อยแล้ว')
        selectedItems.value = []
        selectAll.value = false
        confirmInput.value = ''
    }

    } catch (error) {
        console.error('Error:', error)
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
    } finally {
        isLoading.value = false
    }
}

watch(showConfirmModal, (newVal) => {
    if (!newVal) {
        confirmInput.value = '' 
        isExpanded.value = false
    }
})

</script>

<style scoped>
.fixed {
    animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>