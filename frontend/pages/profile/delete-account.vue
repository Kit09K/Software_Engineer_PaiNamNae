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
                                <span class="text-lg font-medium text-gray-800">เลือกทั้งหมด</span>
                            </label>

                            <!-- รายการข้อมูลย่อย (สีดำตามรูป) -->
                            <div class="ml-4 space-y-4">
                                <label v-for="(item, index) in dataItems" :key="index" class="flex items-center space-x-3 cursor-pointer group">
                                    <div class="w-5 h-5 border-2 border-gray-400 rounded-full flex items-center justify-center group-hover:border-blue-500 transition-colors">
                                        <input type="checkbox" class="sr-only peer" v-model="selectedItems" :value="index">
                                        <div class="w-3 h-3 bg-blue-500 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                                    </div>
                                    <!-- ส่วนที่เป็นขีดสีดำตามรูป -->
                                    <span class="text-gray-800 font-medium">{{ item.name }}</span>
                                </label>
                            </div>

                            <!-- ส่วนท้าย: รับรายละเอียดทาง Email -->
                            <label class="flex items-center space-x-3 cursor-pointer group pt-4">
                                <div class="w-5 h-5 border-2 border-gray-400 rounded-full flex items-center justify-center group-hover:border-blue-500 transition-colors">
                                    <input type="checkbox" class="sr-only peer" v-model="sendEmail">
                                    <div class="w-3 h-3 bg-blue-500 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                                </div>
                                <span class="text-gray-700">ต้องการรับรายละเอียดข้อมูลที่ลบทาง Email หรือไม่</span>
                            </label>
                        </div>

                        <!-- ปุ่มลบด้านล่างขวา -->
                        <div class="flex justify-end mt-12">
                            <button 
                                @click="handleDelete"
                                class="bg-red-600 text-white px-10 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-md text-lg"
                            >
                                ลบ
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>

        <VehicleModal :show="isModalOpen" @close="closeAndRefresh" />
    </div>
</template>

<script setup>
import { ref } from 'vue'

const selectAll = ref(false)
const selectedItems = ref([])
const sendEmail = ref(false)

// ข้อมูลจำลองตามรูปที่คุณให้มา (รูปขีดสีดำ)
const dataItems = ref([
  { name: 'Example1' },
  { name: 'Example2' },
  { name: 'Example3' },
  { name: 'Example4' },
  { name: 'Example5' }
])

const toggleAll = () => {
  if (selectAll.value) {
    selectedItems.value = dataItems.value.map((_, index) => index)
  } else {
    selectedItems.value = []
  }
}

const handleDelete = () => {
  if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลที่เลือก?')) {
    console.log('ข้อมูลที่จะลบ:', selectedItems.value)
    console.log('ส่งเมล์ยืนยัน:', sendEmail.value)
    // เพิ่ม Logic การส่งคำขอไป Backend ที่นี่
  }
}
</script>

<style scoped>
/* คุณสามารถเพิ่ม CSS ตกแต่งเพิ่มเติมได้ที่นี่ */
</style>