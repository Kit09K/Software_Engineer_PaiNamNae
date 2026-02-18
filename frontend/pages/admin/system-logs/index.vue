<template>
    <div class="">
        <AdminHeader />
        <AdminSidebar />

        <main id="main-content" class="main-content mt-16 ml-0 lg:ml-[280px] p-6 transition-all duration-300">
            <div class="p-6 bg-gray-50 min-h-screen">
                <div class="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    
                    <div class="p-6 border-b border-gray-200 bg-white">
                        <div class="flex justify-between items-start">
                            <div>
                                <h1 class="text-2xl font-bold text-gray-900">System Logs (บันทึกกิจกรรมระบบ)</h1>
                                <p class="text-sm text-gray-500 mt-1">บันทึกข้อมูลตาม พ.ร.บ. คอมพิวเตอร์ฯ และการเข้าถึงข้อมูล (PDPA)</p>
                            </div>
                            <div class="text-right">
                                <span class="text-xs text-gray-400">Last updated: {{ new Date().toLocaleTimeString() }}</span>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 mt-6">
                            <div class="md:col-span-4 relative">
                                <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                    <i class="fas fa-search"></i>
                                </span>
                                <input 
                                    v-model="filter.search" 
                                    @keyup.enter="handleSearch"
                                    type="text" 
                                    placeholder="ค้นหา Username, IP หรือ ID..." 
                                    class="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                >
                            </div>

                            <div class="md:col-span-3">
                                <select v-model="filter.action" @change="handleSearch" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                    <option value="">ทุก Action (All)</option>
                                    <option value="LOGIN">LOGIN / LOGOUT</option>
                                    <option value="CREATE_DATA">CREATE DATA</option>
                                    <option value="UPDATE_DATA">UPDATE DATA</option>
                                    <option value="DELETE_DATA">DELETE DATA</option>
                                    <option value="ACCESS_SENSITIVE_DATA">SENSITIVE ACCESS</option>
                                    <option value="SOS_TRIGGERED">SOS ALERT</option>
                                </select>
                            </div>

                            <div class="md:col-span-3">
                                <input 
                                    v-model="filter.date" 
                                    @change="handleSearch"
                                    type="date" 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                            </div>

                            <div class="md:col-span-2 flex gap-2">
                                <button @click="handleSearch" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm">
                                    ค้นหา
                                </button>
                                <button @click="exportLogs" class="flex-none bg-green-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-green-700 transition shadow-sm" title="Export CSV">
                                    <i class="fas fa-file-csv"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="overflow-x-auto relative min-h-[400px]">
                        
                        <div v-if="pending" class="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-sm">
                            <div class="flex flex-col items-center">
                                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-2"></div>
                                <span class="text-sm text-gray-500 font-medium">กำลังโหลดข้อมูล...</span>
                            </div>
                        </div>

                        <table class="w-full text-left border-collapse">
                            <thead class="bg-gray-50 sticky top-0">
                                <tr class="text-gray-600 uppercase text-xs font-bold border-b border-gray-200">
                                    <th class="px-6 py-4 whitespace-nowrap">Timestamp</th>
                                    <th class="px-6 py-4">User / IP</th>
                                    <th class="px-6 py-4">Action</th>
                                    <th class="px-6 py-4">Target Table</th>
                                    <th class="px-6 py-4 w-1/3">Details</th>
                                </tr>
                            </thead>
                            
                            <tbody class="divide-y divide-gray-100">
                                <tr v-if="!pending && (!logResponse?.data || logResponse.data.length === 0)">
                                    <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                                        <div class="flex flex-col items-center justify-center">
                                            <i class="fas fa-search text-3xl mb-3 text-gray-300"></i>
                                            <p>ไม่พบข้อมูลตามเงื่อนไขที่ค้นหา</p>
                                        </div>
                                    </td>
                                </tr>

                                <tr v-for="log in logResponse?.data" :key="log.id" class="hover:bg-blue-50/50 transition-colors">
                                    <td class="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                        <div class="font-medium">{{ formatDate(log.timestamp).date }}</div>
                                        <div class="text-xs text-gray-400">{{ formatDate(log.timestamp).time }}</div>
                                    </td>

                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-2">
                                            <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">
                                                {{ (log.user?.username || 'SYS').substring(0,2).toUpperCase() }}
                                            </div>
                                            <div>
                                                <div class="text-sm font-bold text-gray-900">
                                                    {{ log.user?.username || 'System (Auto)' }}
                                                </div>
                                                <div class="text-xs text-gray-500 font-mono">
                                                    IP: {{ log.ipAddress }}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td class="px-6 py-4">
                                        <span :class="actionBadge(log.action)" class="px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap inline-flex items-center gap-1">
                                            <i :class="actionIcon(log.action)"></i>
                                            {{ log.action }}
                                        </span>
                                    </td>

                                    <td class="px-6 py-4 text-sm">
                                        <div v-if="log.targetTable" class="font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                                            {{ log.targetTable }}
                                        </div>
                                        <div v-else class="text-gray-400 italic">-</div>
                                        
                                        <div v-if="log.targetId" class="text-xs text-gray-400 mt-1 font-mono truncate max-w-[150px]" :title="log.targetId">
                                            ID: {{ log.targetId }}
                                        </div>
                                    </td>

                                    <td class="px-6 py-4">
                                        <div class="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded border border-gray-100 overflow-x-auto max-w-xs max-h-20 scrollbar-thin">
                                            {{ formatDetails(log.details) }}
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <span class="text-sm text-gray-600">
                            แสดงหน้า <span class="font-bold">{{ page }}</span> จาก <span class="font-bold">{{ logResponse?.pagination?.totalPages || 1 }}</span> 
                            (ทั้งหมด {{ logResponse?.pagination?.total || 0 }} รายการ)
                        </span>

                        <div class="flex gap-2">
                            <button 
                                @click="page--" 
                                :disabled="page === 1 || pending"
                                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <i class="fas fa-chevron-left mr-1"></i> ก่อนหน้า
                            </button>
                            
                            <button 
                                @click="page++" 
                                :disabled="page >= (logResponse?.pagination?.totalPages || 1) || pending"
                                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                ถัดไป <i class="fas fa-chevron-right ml-1"></i>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
// นำเข้า Components (ตรวจสอบ Path ให้ถูกต้องตามโปรเจคจริง)
import AdminHeader from '~/components/admin/AdminHeader.vue'
import AdminSidebar from '~/components/admin/AdminSidebar.vue'

// --- Config ---
const config = useRuntimeConfig()
const apiBase = config.public.apiBase || 'http://localhost:8000/api' // แก้ Port ให้ตรง Backend

// --- State ---
const page = ref(1)
const limit = ref(20)
const filter = ref({
    search: '',
    action: '',
    date: ''
})

// --- Data Fetching ---
// สร้าง Computed Params เพื่อให้ Nuxt รู้ว่าต้องส่งค่าล่าสุดไป
const queryParams = computed(() => ({
    page: page.value,
    limit: limit.value,
    search: filter.value.search,
    action: filter.value.action,
    date: filter.value.date
}))

// ดึง Token จาก LocalStorage (ต้องเช็คว่ารันบน Browser ไหม)
const getToken = () => {
    if (import.meta.client) {
        return localStorage.getItem('token')
    }
    return ''
}

const { data: logResponse, pending, refresh, error } = await useFetch(`${apiBase}/admin/logs`, {
    // 1. สำคัญ: สั่งให้รันเฉพาะฝั่ง Client เพื่อให้เจอ LocalStorage
    server: false,
    
    // 2. ผูก Query แบบ Reactive
    query: queryParams,
    
    // 3. ใส่ Header Token
    headers: computed(() => ({
        Authorization: `Bearer ${getToken()}`
    })),

    // Debug Error ถ้ามี
    onResponseError({ response }) {
        console.error('API Error:', response._data)
        if (response.status === 401) {
            // Token หมดอายุ ให้เด้งไป Login
            window.location.href = '/login'
        }
    }
})

// --- Watchers ---

// เมื่อเปลี่ยน Filter ให้รีเซ็ตกลับหน้า 1 (Log จะได้ไม่ว่างถ้าหน้าปัจจุบันเกินจำนวนผลลัพธ์ใหม่)
watch(() => [filter.value.action, filter.value.date, filter.value.search], () => {
    page.value = 1
    // หมายเหตุ: useFetch จะ refresh เองอัตโนมัติเพราะ queryParams เปลี่ยน
})


// --- Methods ---

const handleSearch = () => {
    page.value = 1
    // บังคับโหลดใหม่ (เผื่อ useFetch ไม่ detect การกด enter)
    refresh()
}

const formatDate = (dateStr) => {
    if (!dateStr) return { date: '-', time: '' }
    const d = new Date(dateStr)
    return {
        date: d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }
}

const formatDetails = (details) => {
    if (!details) return '-'
    try {
        // เช็คก่อนว่าเป็น Object หรือ String
        const content = typeof details === 'string' ? JSON.parse(details) : details
        return JSON.stringify(content, null, 2).replace(/[{}"]/g, '').replace(/,/g, ', ')
    } catch (e) {
        return String(details)
    }
}

const actionBadge = (action) => {
    const map = {
        'LOGIN': 'bg-purple-100 text-purple-700 border-purple-200',
        'LOGOUT': 'bg-gray-100 text-gray-600 border-gray-200',
        'CREATE_DATA': 'bg-green-100 text-green-700 border-green-200',
        'UPDATE_DATA': 'bg-blue-100 text-blue-700 border-blue-200',
        'DELETE_DATA': 'bg-red-100 text-red-700 border-red-200',
        'ACCESS_SENSITIVE_DATA': 'bg-amber-100 text-amber-800 border-amber-200',
        'APPROVE_VERIFICATION': 'bg-teal-100 text-teal-700 border-teal-200',
        'REJECT_VERIFICATION': 'bg-pink-100 text-pink-700 border-pink-200',
        'SOS_TRIGGERED': 'bg-red-600 text-white border-red-600 animate-pulse'
    }
    return map[action] || 'bg-gray-100 text-gray-600 border-gray-200'
}

const actionIcon = (action) => {
    const map = {
        'LOGIN': 'fas fa-sign-in-alt',
        'LOGOUT': 'fas fa-sign-out-alt',
        'CREATE_DATA': 'fas fa-plus-circle',
        'UPDATE_DATA': 'fas fa-edit',
        'DELETE_DATA': 'fas fa-trash-alt',
        'ACCESS_SENSITIVE_DATA': 'fas fa-eye',
        'APPROVE_VERIFICATION': 'fas fa-check-circle',
        'REJECT_VERIFICATION': 'fas fa-times-circle',
        'SOS_TRIGGERED': 'fas fa-bell'
    }
    return map[action] || 'fas fa-circle'
}

const exportLogs = () => {
    const token = getToken()
    const params = new URLSearchParams({
        search: filter.value.search,
        action: filter.value.action,
        date: filter.value.date,
        token: token // ส่ง Token ไปทาง Query Param ชั่วคราวเพื่อให้โหลดไฟล์ได้ (หรือใช้ blob method ก็ได้แต่นี่ยากกว่า)
    }).toString()
    
    window.open(`${apiBase}/admin/logs/export?${params}`, '_blank')
}

useHead({
    title: 'System Logs | Painamnae Admin',
    link: [
        { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css' }
    ]
})
</script>

<style scoped>
/* Custom Scrollbar สำหรับช่อง Details */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 4px;
}
</style>