<template>
    <div class="">
        <AdminHeader />
        <AdminSidebar />

        <!-- Main Content -->
        <main id="main-content" class="main-content mt-16 ml-0 lg:ml-[280px] p-6">
            <div class="p-6 bg-gray-50 min-h-screen">
                <div class="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <!-- Header Section -->
                    <div class="p-6 border-b border-gray-200 bg-white">
                        <h1 class="text-2xl font-bold text-gray-900">System Logs (บันทึกกิจกรรมระบบ)</h1>
                        <p class="text-sm text-gray-500 mt-1">บันทึกข้อมูลตาม พ.ร.บ. คอมพิวเตอร์ฯ และการเข้าถึงข้อมูล (PDPA)</p>
        
                        <!-- Filter Bar -->
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                            <input v-model="filter.search" type="text" placeholder="ค้นหา Username หรือ IP..." class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                            <select v-model="filter.action" class="px-4 py-2 border rounded-lg outline-none">
                                <option value="">ทุก Action</option>
                                <option value="CREATE">CREATE</option>
                                <option value="UPDATE">UPDATE</option>
                                <option value="DELETE">DELETE</option>
                                <option value="LOGIN">LOGIN</option>
                            </select>
                            <input v-model="filter.date" type="date" class="px-4 py-2 border rounded-lg outline-none">
                            <button @click="exportLogs" class="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition">
                                Export CSV
                            </button>
                        </div>
                    </div>

                    <!-- Table Section -->
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
                                    <th class="px-6 py-4">Timestamp</th>
                                    <th class="px-6 py-4">User / IP</th>
                                    <th class="px-6 py-4">Action</th>
                                    <th class="px-6 py-4">Target Table</th>
                                    <th class="px-6 py-4">Details</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                <tr v-for="log in filteredLogs" :key="log.id" class="hover:bg-blue-50 transition-colors">
                                    <td class="px-6 py-4 text-sm text-gray-600">
                                        {{ formatDate(log.timestamp) }}
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="text-sm font-bold text-gray-900">{{ log.user?.username || 'System' }}</div>
                                        <div class="text-xs text-gray-400">{{ log.ipAddress }}</div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span :class="actionBadge(log.action)" class="px-2 py-1 rounded-md text-xs font-bold">
                                            {{ log.action }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-sm font-medium text-blue-600">
                                        {{ log.targetTable }} <span class="text-gray-400 text-xs">({{ log.targetId }})</span>
                                    </td>
                                    <td class="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">
                                        {{ JSON.stringify(log.details) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import AdminHeader from '~/components/admin/AdminHeader.vue'
import AdminSidebar from '~/components/admin/AdminSidebar.vue'

const logs = ref([])
const filter = ref({
  search: '',
  action: '',
  date: ''
})

onMounted(async () => {
  logs.value = [
    {
        id: "LOG001",
        timestamp: "2024-03-20T14:05:12Z",
        userId: "U001",
        user: { username: "somchai_admin" },
        action: "DELETE",
        ipAddress: "192.168.1.105",
        targetTable: "Vehicle",
        targetId: "VEH_99",
        details: { reason: "หมดอายุการใช้งาน" }
    },
    {
        id: "LOG002",
        timestamp: "2024-03-20T15:20:00Z",
        userId: "U002",
        user: { username: "kanda_driver" },
        action: "UPDATE",
        ipAddress: "1.10.222.15",
        targetTable: "Route",
        targetId: "RT_882",
        details: { field: "price", old: 100, new: 120 }
    }
  ]
})

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    const matchSearch = log.user?.username.toLowerCase().includes(filter.search.toLowerCase()) || 
                        log.ipAddress.includes(filter.search)
    const matchAction = filter.action === '' || log.action === filter.action
    const matchDate = filter.date === '' || log.timestamp.includes(filter.date)
    return matchSearch && matchAction && matchDate
  })
})

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('th-TH')
}

const actionBadge = (action) => {
  const styles = {
    'DELETE': 'bg-red-100 text-red-600',
    'CREATE': 'bg-green-100 text-green-600',
    'UPDATE': 'bg-blue-100 text-blue-600',
    'LOGIN': 'bg-purple-100 text-purple-600'
  }
  return styles[action] || 'bg-gray-100 text-gray-600'
}

const exportLogs = () => {
  alert('Exporting data as CSV...')
}
</script>