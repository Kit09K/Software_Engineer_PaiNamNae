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

            <div v-if="showConfirmModal" class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div class="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-8 max-w-sm w-full mx-4 border border-gray-200 pointer-events-auto">
                    <h2 class="text-xl font-bold text-center text-gray-900 mb-4">
                        คุณต้องการลบข้อมูลที่เลือกใช่หรือไม่
                    </h2>
        
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
    if (newVal.length > 0) {
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
}

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
        confirmInput.value = '' // ล้างข้อความในช่องกรอกทันทีที่ Modal ปิด
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