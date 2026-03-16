<template>
    <div class="">
        <AdminHeader />
        <AdminSidebar />

        <main id="main-content" class="main-content mt-16 ml-0 lg:ml-[280px] p-6 transition-all duration-300">
            <div class="p-6 bg-gray-50 min-h-screen">
                <div class="max-w-[98%] mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                    <div class="p-6 border-b border-gray-200 bg-white">
                        <div class="flex justify-between items-start">
                            <div>
                                <h1 class="text-2xl font-bold text-gray-900">System Logs (บันทึกกิจกรรมระบบ)</h1>
                                <p class="text-sm text-gray-500 mt-1">บันทึกข้อมูลตาม พ.ร.บ. คอมพิวเตอร์ฯ
                                    และการเข้าถึงข้อมูล (PDPA)</p>
                            </div>
                            <div class="text-right">
                                <span class="text-xs text-gray-400">Last updated: {{ new Date().toLocaleTimeString()
                                    }}</span>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 mt-6">
                            <div class="md:col-span-3 relative">
                                <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                    <i class="fas fa-search"></i>
                                </span>
                                <input v-model="filter.search" @input="filter.search = filter.search.trimStart()"
                                    type="text" placeholder="ค้นหา Username, IP หรือ ID..."
                                    class="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors">
                            </div>

                            <div class="md:col-span-2">
                                <select v-model="filter.action"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                    <option value="">ทุก Action (All)</option>
                                    <option value="LOGIN">LOGIN / LOGOUT</option>
                                    <option value="CREATE_DATA">CREATE DATA</option>
                                    <option value="UPDATE_DATA">UPDATE DATA</option>
                                    <option value="DELETE_DATA">DELETE DATA</option>
                                    <option value="VIEW_DATA">VIEW_DATA</option>
                                    <option value="EXPORT_LOGS">EXPORT_LOGS</option>
                                    <option value="BOOKING_CONFIRM">BOOKING_CONFIRM</option>
                                    <option value="BOOKING_REQUEST">BOOKING_REQUEST</option>
                                    <option value="ROUTE_CREATE">ROUTE_CREATE</option>
                                    <option value="VERIFY_APPROVE">VERIFY_APPROVE</option>
                                </select>
                            </div>


                            <div class="md:col-span-3">
                                <div
                                    class="flex items-center border border-gray-200 rounded-xl bg-gray-50/50 hover:bg-white transition-all focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden h-[42px]">
                                    <div class="pl-3 text-gray-400">
                                        <i class="far fa-calendar text-xs"></i>
                                    </div>
                                    <input v-model="filter.startDate" type="date"
                                        class="w-full px-2 py-2 bg-transparent outline-none text-sm border-none focus:ring-0 text-center">
                                    <span class="text-gray-300 font-light px-1">-</span>
                                    <input v-model="filter.endDate" type="date" :min="filter.startDate"
                                        class="w-full px-2 py-2 bg-transparent outline-none text-sm border-none focus:ring-0 text-center">
                                </div>
                            </div>

                            <div class="md:col-span-2">
                                <div class="flex items-center border border-gray-200 rounded-xl bg-gray-50/50 hover:bg-white transition-all focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden h-[42px]">
                                    <div class="pl-3 text-gray-400">
                                        <i class="far fa-clock text-xs"></i>
                                    </div>
                                    
                                    <input 
                                        v-model="filter.startTime" 
                                        type="text" 
                                        maxlength="5"
                                        @input="formatTimeInput($event, 'startTime')"
                                        class="w-full px-2 py-2 bg-transparent outline-none text-sm border-none focus:ring-0 text-center placeholder:text-gray-300"
                                        placeholder="00:00"
                                    >
                                    
                                    <span class="text-gray-300 font-light px-1">-</span>
                                    
                                    <input 
                                        v-model="filter.endTime" 
                                        type="text" 
                                        maxlength="5"
                                        @input="formatTimeInput($event, 'endTime')"
                                        class="w-full px-2 py-2 bg-transparent outline-none text-sm border-none focus:ring-0 text-center placeholder:text-gray-300"
                                        placeholder="23:59"
                                    >
                                </div>
                            </div>


                            <div class="md:col-span-2 flex gap-2">
                                <button @click="handleSearch"
                                    class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm">
                                    ค้นหา
                                </button>
                                <button @click="exportLogs"
                                    class="flex-none bg-amber-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-amber-600 transition shadow-sm"
                                    title="Export JSON">
                                    <i class="fas fa-file-code"></i>
                                </button>
                                <button @click="checkLogIntegrity"
                                    class="flex-none bg-emerald-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-emerald-700 transition shadow-sm"
                                    title="Check Log Integrity"
                                    :disabled="isVerifying">
                                    <i :class="isVerifying ? 'fas fa-spinner fa-spin' : 'fas fa-shield-alt'"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="overflow-x-auto relative min-h-[400px]">
                        <table class="w-full text-left border-collapse" v-if="!isLoading">
                            <thead class="bg-gray-50 sticky top-0">
                                <tr class="text-gray-600 uppercase text-xs font-bold border-b border-gray-200">
                                    <th class="px-6 py-4 whitespace-nowrap">Timestamp</th>
                                    <th class="px-6 py-4">User / IP</th>
                                    <th class="px-6 py-4">Action</th>
                                    <th class="px-6 py-4">API Path</th>
                                    <th class="px-6 py-4 w-1/2">Details</th>
                                </tr>
                            </thead>

                            <tbody class="divide-y divide-gray-100">
                                <tr v-if="logs.length === 0">
                                    <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                                        <div class="flex flex-col items-center justify-center">
                                            <i class="fas fa-search text-3xl mb-3 text-gray-300"></i>
                                            <p>ไม่พบข้อมูลตามเงื่อนไขที่ค้นหา</p>
                                        </div>
                                    </td>
                                </tr>

                                <tr v-for="log in logs" :key="log.id" class="hover:bg-blue-50/50 transition-colors">
                                    <td class="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                        <div class="font-medium">{{ formatDate(log.timestamp).date }}</div>
                                        <div class="text-xs text-gray-400">{{ formatDate(log.timestamp).time }}</div>
                                    </td>

                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-2">
                                            <div
                                                class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">
                                                {{ (log.user?.username || 'SYS').substring(0, 2).toUpperCase() }}
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
                                        <span :class="actionBadge(log.action)"
                                            class="px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap inline-flex items-center gap-1">
                                            <i :class="actionIcon(log.action)"></i>
                                            {{ log.action }}
                                        </span>
                                    </td>

                                    <td class="px-6 py-4">
                                        <span v-if="log.apiPath"
                                            class="inline-block text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded max-w-[220px] truncate"
                                            :title="log.apiPath">
                                            {{ log.apiPath }}
                                        </span>
                                        <span v-else class="text-xs text-gray-300">—</span>
                                    </td>

                                    <td class="px-6 py-4">
                                        <div
                                            class="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded border border-gray-100 overflow-x-auto max-h-20 scrollbar-thin">
                                            {{ formatDetails(log.details) }}
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <!-- Loading State -->
                        <div v-if="isLoading" class="flex flex-col items-center justify-center h-96">
                            <div class="text-center">
                                <div class="inline-block">
                                    <div
                                        class="inline-block border-4 border-gray-200 border-t-blue-500 rounded-full w-12 h-12 animate-spin">
                                    </div>
                                </div>
                                <p class="mt-4 text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
                            </div>
                        </div>
                    </div>

                    <div
                        class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <span class="text-sm text-gray-600">
                            แสดงหน้า <span class="font-bold">{{ page }}</span> จาก <span class="font-bold">{{ totalPages
                                }}</span>
                            (ทั้งหมด {{ totalItems }} รายการ)
                        </span>

                        <div class="flex gap-2">
                            <button @click="page--" :disabled="page === 1"
                                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <i class="fas fa-chevron-left mr-1"></i> ก่อนหน้า
                            </button>

                            <button @click="page++" :disabled="page >= totalPages"
                                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                ถัดไป <i class="fas fa-chevron-right ml-1"></i>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </main>
        <div v-if="showExportModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showExportModal = false"></div>

            <div
                class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
                <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <i class="fas fa-file-code text-amber-500"></i>
                        ตั้งค่าการ Export ข้อมูล
                    </h3>
                    <button @click="showExportModal = false" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">เลือกข้อมูลที่ต้องการ
                            (Additional Fields)</span>
                        <button @click="toggleSelectAll" class="text-xs font-semibold text-blue-600 hover:underline">
                            {{ selectedExportFields.length === Object.keys(exportFieldOptions).length ? 'ยกเลิกทั้งหมด'
                                : 'เลือกทั้งหมด' }}
                        </button>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label v-for="(label, key) in exportFieldOptions" :key="key"
                            class="flex items-center p-3 rounded-xl border border-gray-100 hover:bg-blue-50/50 hover:border-blue-200 cursor-pointer transition-all group">
                            <input type="checkbox" v-model="selectedExportFields" :value="key"
                                class="w-5 h-5 rounded text-blue-600 border-gray-300 focus:ring-blue-500 transition cursor-pointer">
                            <span class="ml-3 text-sm font-medium text-gray-700 group-hover:text-blue-700">{{ label
                                }}</span>
                        </label>
                    </div>
                </div>

                <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                    <button @click="showExportModal = false"
                        class="flex-1 px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700">
                        ยกเลิก
                    </button>
                    <button @click="confirmExport"
                        class="flex-[2] bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                        ยืนยันการ Export ({{ selectedExportFields.length }})
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Log Integrity Verification Modal -->
    <div v-if="showIntegrityModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showIntegrityModal = false"></div>

        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-100">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <i class="fas fa-shield-alt text-emerald-500"></i>
                    Log Integrity Status
                </h3>
                <button @click="showIntegrityModal = false" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="p-6">
                <!-- Loading -->
                <div v-if="isVerifying" class="flex flex-col items-center justify-center py-8">
                    <div class="inline-block border-4 border-gray-200 border-t-emerald-500 rounded-full w-12 h-12 animate-spin"></div>
                    <p class="mt-4 text-gray-600 font-medium">กำลังตรวจสอบ integrity...</p>
                </div>

                <!-- ========== FULL-CHAIN MODE (logs < 100, or anchor-fallback) ========== -->
                <div v-else-if="integrityResult && integrityResult.mode === 'full-chain'">

                    <!-- Anchor-missing warning (only when anchorWarning is set, i.e. >= 100 logs but no anchors) -->
                    <div v-if="integrityResult.anchorWarning" class="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                        <div class="flex items-start gap-3">
                            <i class="fas fa-exclamation-triangle text-amber-500 text-xl mt-0.5"></i>
                            <div>
                                <p class="font-semibold text-amber-800">⚠ Anchor checkpoints missing.</p>
                                <p class="text-sm text-amber-700 mt-1">{{ integrityResult.anchorWarning }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Normal info banner (< 100 logs, no anchors yet — expected state) -->
                    <div v-else class="mb-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
                        <div class="flex items-start gap-3">
                            <i class="fas fa-info-circle text-blue-500 text-xl mt-0.5"></i>
                            <div>
                                <p class="font-semibold text-blue-800">ℹ Anchor checkpoints not yet created.</p>
                                <p class="text-sm text-blue-600 mt-1">System verified the entire log chain directly.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Overall Status -->
                    <div class="mb-4 p-4 rounded-xl" :class="integrityResult.valid ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <i :class="integrityResult.valid ? 'fas fa-check-circle text-emerald-500 text-2xl' : 'fas fa-exclamation-triangle text-red-500 text-2xl'"></i>
                                <div>
                                    <span class="font-bold text-lg" :class="integrityResult.valid ? 'text-emerald-700' : 'text-red-700'">
                                        Chain Status: {{ integrityResult.valid ? '✅ VALID' : '❌ CORRUPTED' }}
                                    </span>
                                    <p class="text-sm text-gray-500">Total Logs Checked: {{ integrityResult.totalLogs }}</p>
                                </div>
                            </div>
                            <span v-if="!integrityResult.valid && integrityResult.corruptedRow" class="text-sm font-mono text-red-600">
                                First corruption at row #{{ integrityResult.corruptedRow }}
                            </span>
                        </div>
                    </div>

                    <!-- Hash Chain Verification Table -->
                    <div v-if="integrityResult.rows && integrityResult.rows.length > 0">
                        <h4 class="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <i class="fas fa-link text-gray-400"></i>
                            Hash Chain Verification
                        </h4>
                        <div class="overflow-auto max-h-72 rounded-lg border border-gray-200">
                            <table class="w-full text-left text-sm">
                                <thead class="bg-gray-50 sticky top-0">
                                    <tr class="text-gray-500 text-xs uppercase font-bold">
                                        <th class="px-3 py-2.5 whitespace-nowrap">Row</th>
                                        <th class="px-3 py-2.5">Action</th>
                                        <th class="px-3 py-2.5 font-mono whitespace-nowrap">Log ID</th>
                                        <th class="px-3 py-2.5 font-mono whitespace-nowrap">Prev Hash</th>
                                        <th class="px-3 py-2.5 font-mono whitespace-nowrap">Current Hash</th>
                                        <th class="px-3 py-2.5 text-center whitespace-nowrap">Status</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100">
                                    <tr v-for="row in integrityResult.rows" :key="row.row"
                                        :class="row.status === 'CORRUPTED' ? 'bg-red-50' : 'hover:bg-gray-50'">
                                        <td class="px-3 py-2 font-mono text-gray-700 font-medium">{{ row.row }}</td>
                                        <td class="px-3 py-2">
                                            <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 whitespace-nowrap">
                                                {{ row.action }}
                                            </span>
                                        </td>
                                        <td class="px-3 py-2 font-mono text-xs text-gray-400" :title="row.logId">
                                            {{ row.logId ? row.logId.substring(0, 8) + '…' : '-' }}
                                        </td>
                                        <td class="px-3 py-2 font-mono text-xs"
                                            :class="row.status === 'CORRUPTED' ? 'text-red-500' : 'text-gray-500'"
                                            :title="row.prevHash">
                                            {{ shortenHash(row.prevHash) }}
                                        </td>
                                        <td class="px-3 py-2 font-mono text-xs"
                                            :class="row.status === 'CORRUPTED' ? 'text-red-500' : 'text-gray-500'"
                                            :title="row.currentHash">
                                            {{ shortenHash(row.currentHash) }}
                                        </td>
                                        <td class="px-3 py-2 text-center">
                                            <span v-if="row.status === 'OK'" class="text-emerald-500 text-base">✅</span>
                                            <span v-else class="text-red-500 text-base" :title="'Row ' + row.row + ' hash mismatch'">❌</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- No logs in system at all -->
                    <div v-else class="text-center py-6">
                        <i class="fas fa-database text-3xl text-gray-300 mb-2"></i>
                        <p class="text-gray-500">ยังไม่มี log ในระบบ</p>
                    </div>
                </div>

                <!-- ========== ANCHOR MODE (logs >= 100) ========== -->
                <div v-else-if="integrityResult">
                    <!-- Overall Status -->
                    <div class="mb-4 p-4 rounded-xl" :class="integrityResult.status === 'OK' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'">
                        <div class="flex items-center gap-3">
                            <i :class="integrityResult.status === 'OK' ? 'fas fa-check-circle text-emerald-500 text-2xl' : 'fas fa-exclamation-triangle text-red-500 text-2xl'"></i>
                            <div>
                                <span class="font-bold text-lg" :class="integrityResult.status === 'OK' ? 'text-emerald-700' : 'text-red-700'">
                                    {{ integrityResult.status === 'OK' ? 'All Blocks Verified' : 'Integrity Issue Detected' }}
                                </span>
                                <p class="text-sm text-gray-500">ตรวจสอบทั้งหมด {{ integrityResult.blocksChecked }} blocks</p>
                            </div>
                        </div>
                    </div>

                    <!-- Block List -->
                    <div class="space-y-2 max-h-64 overflow-y-auto">
                        <div v-for="block in integrityBlocks" :key="block.start"
                            class="flex items-center justify-between p-3 rounded-lg border"
                            :class="block.corrupted ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'">
                            <div class="flex items-center gap-3">
                                <i :class="block.corrupted ? 'fas fa-times-circle text-red-500' : 'fas fa-check-circle text-emerald-500'"></i>
                                <span class="font-mono text-sm font-medium text-gray-700">
                                    Block {{ block.start }} - {{ block.end }}
                                </span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="px-2.5 py-1 rounded-full text-xs font-bold"
                                    :class="block.corrupted ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'">
                                    {{ block.corrupted ? 'CORRUPTED' : 'OK' }}
                                </span>
                                <button v-if="block.corrupted" @click="investigateBlock(block.start, block.end)"
                                    class="px-3 py-1 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                                    :disabled="block.investigating">
                                    <i :class="block.investigating ? 'fas fa-spinner fa-spin' : 'fas fa-search'"></i>
                                    Investigate
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Block Investigation Details -->
                    <div v-if="blockDetail" class="mt-4 p-4 bg-gray-900 rounded-xl text-sm font-mono text-green-400 overflow-x-auto max-h-48">
                        <p class="text-gray-400 mb-2"># Block Investigation Result</p>
                        <p>Status: <span :class="blockDetail.status === 'OK' ? 'text-emerald-400' : 'text-red-400'">{{ blockDetail.status }}</span></p>
                        <p>Logs Checked: {{ blockDetail.logsChecked }}</p>
                        <div v-if="blockDetail.mismatches && blockDetail.mismatches.length > 0" class="mt-2">
                            <p class="text-red-400">Mismatches found:</p>
                            <div v-for="(m, idx) in blockDetail.mismatches" :key="idx" class="ml-2 mt-1 text-yellow-300">
                                <p>- Position #{{ m.position }}: {{ m.issue }}</p>
                                <p class="text-gray-500 text-xs ml-2">Log ID: {{ m.logId }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button @click="showIntegrityModal = false"
                    class="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition">
                    ปิด
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import AdminHeader from '~/components/admin/AdminHeader.vue'
import AdminSidebar from '~/components/admin/AdminSidebar.vue'

// API
const { $api } = useNuxtApp()

// --- UI State ---
const page = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const isLoading = ref(false)
const filter = ref({
    search: '',
    action: '',
    startDate: '',  // เปลี่ยนจาก date
    endDate: '',    // เพิ่มใหม่
    startTime: '00:00',
    endTime: '23:59'
    // search: '',
    // action: '',
    // date: '' ,
    // startTime: '00:00', 
    // endTime: '23:59'    
})

const showExportModal = ref(false)
const selectedExportFields = ref([])

// --- Log Integrity State ---
const showIntegrityModal = ref(false)
const isVerifying = ref(false)
const integrityResult = ref(null)
const integrityBlocks = ref([])
const blockDetail = ref(null)
const exportFieldOptions = {
    fullName: 'ชื่อ - สกุล',
    idCard: 'เลขบัตรประชาชน',
    email: 'อีเมล',
    phone: 'เบอร์โทรศัพท์',
    driverLicense: 'เลขที่ใบขับขี่',
    carBrand: 'ยี่ห้อและรุ่นรถ',
    plateNumber: 'หมายเลขทะเบียน',
    carType: 'ชนิดของรถ',
    carColor: 'สีรถ'
}

const formatTimeInput = (event, field) => {
    let value = event.target.value.replace(/[^0-9]/g, ''); // เอาเฉพาะตัวเลข

    if (value.length >= 3) {
        value = value.slice(0, 2) + ':' + value.slice(2, 4);
    }

    // ตรวจสอบความถูกต้องเบื้องต้น 
    const [hours, minutes] = value.split(':');
    if (hours > 23) value = '23' + (minutes ? ':' + minutes : '');
    if (minutes > 59) value = hours + ':59';

    filter.value[field] = value;
}

// ฟังก์ชันสำหรับเลือก/ไม่เลือก ทั้งหมด
const toggleSelectAll = () => {
    if (selectedExportFields.value.length === Object.keys(exportFieldOptions).length) {
        selectedExportFields.value = []
    } else {
        selectedExportFields.value = Object.keys(exportFieldOptions)
    }
}

const logs = ref([])

// --- Methods ---

// ฟังก์ชันดึงข้อมูล logs จาก API
const fetchLogs = async () => {
    isLoading.value = true
    try {
        // const queryParams = new URLSearchParams({
        //     page: page.value,
        //     limit: 50,
        //     ...(filter.value.search && { search: filter.value.search }),
        //     ...(filter.value.action && { action: filter.value.action }),
        //     ...(filter.value.date && { startDate: filter.value.date, endDate: filter.value.date }),
        //     ...(filter.value.startTime && { startTime: filter.value.startTime }),
        //     ...(filter.value.endTime && { endTime: filter.value.endTime }),

        // })
        const queryParams = new URLSearchParams({
            page: page.value,
            limit: 50,
            ...(filter.value.search && { search: filter.value.search }),
            ...(filter.value.action && { action: filter.value.action }),
            ...(filter.value.startDate && { startDate: filter.value.startDate }),  // แยกกัน
            ...(filter.value.endDate && { endDate: filter.value.endDate }),        // แยกกัน
            ...(filter.value.startTime && { startTime: filter.value.startTime }),
            ...(filter.value.endTime && { endTime: filter.value.endTime }),
        })

        const response = await $api('/system-logs?' + queryParams)

        console.log('API Response:', response)

        let data = []
        let pagination = {}

        // Handle response structure from our API
        if (response && typeof response === 'object') {
            if (response.pagination) {
                // Response has data and pagination properties
                data = response.data || []
                pagination = response.pagination
            } else if (Array.isArray(response)) {
                // Direct array response
                data = response
            } else if (response.results) {
                // Results-based response
                data = response.results
                pagination = response
            } else {
                // Try data property
                data = response.data || []
                pagination = response
            }
        }

        logs.value = data

        if (pagination && pagination.totalResults !== undefined) {
            totalItems.value = pagination.totalResults
            totalPages.value = pagination.totalPages || Math.ceil(pagination.totalResults / 50)
        } else if (pagination && pagination.total !== undefined) {
            totalItems.value = pagination.total
            totalPages.value = Math.ceil(pagination.total / 50)
        }

    } catch (error) {
        console.error('Error fetching logs:', error)
        logs.value = []
    } finally {
        isLoading.value = false
    }
}

// const handleSearch = () => {
//     page.value = 1 // Reset to first page when searching
//     // ensure search term is trimmed to avoid accidental whitespace-only queries
//     if (filter.value.search) {
//         filter.value.search = filter.value.search.trim();
//     }
//     fetchLogs()
// }

const handleSearch = () => {
    // ตรวจสอบว่า startDate ไม่เกิน endDate
    if (filter.value.startDate && filter.value.endDate && filter.value.startDate > filter.value.endDate) {
        alert('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด')
        return
    }
    page.value = 1
    if (filter.value.search) {
        filter.value.search = filter.value.search.trim()
    }
    fetchLogs()
}

const exportLogs = () => {
    console.log('Exporting JSON...')
    showExportModal.value = true // สั่งให้ Popup แสดงผล
}

// --- Log Integrity Functions ---

// ตัดย่อ hash สำหรับแสดงผล
const shortenHash = (hash) => {
    if (!hash) return '-'
    if (hash === 'GENESIS') return 'GENESIS'
    if (hash.length <= 16) return hash
    return hash.substring(0, 8) + '...' + hash.substring(hash.length - 5)
}

const checkLogIntegrity = async () => {
    isVerifying.value = true
    integrityResult.value = null
    integrityBlocks.value = []
    blockDetail.value = null
    showIntegrityModal.value = true

    try {
        const response = await $api('/logs/verify-anchors')
        integrityResult.value = response.data || response

        // Anchor mode: สร้าง block list สำหรับแสดงผล
        if (integrityResult.value.mode === 'anchor') {
            const blocksChecked = integrityResult.value.blocksChecked || 0
            const corrupted = integrityResult.value.corruptedBlocks || []
            const corruptedSet = new Set(corrupted.map(c => `${c.start}-${c.end}`))

            const blocks = []
            for (let i = 0; i < blocksChecked; i++) {
                const start = i * 100 + 1
                const end = (i + 1) * 100
                blocks.push({
                    start,
                    end,
                    corrupted: corruptedSet.has(`${start}-${end}`),
                    investigating: false,
                })
            }
            integrityBlocks.value = blocks
        }
        // Full-chain mode: rows are already in integrityResult
    } catch (error) {
        console.error('Error verifying log integrity:', error)
        integrityResult.value = { status: 'ERROR', mode: 'error', blocksChecked: 0 }
    } finally {
        isVerifying.value = false
    }
}

const investigateBlock = async (start, end) => {
    const block = integrityBlocks.value.find(b => b.start === start && b.end === end)
    if (block) block.investigating = true
    blockDetail.value = null

    try {
        const response = await $api(`/logs/verify-block?start=${start}&end=${end}`)
        blockDetail.value = response.data || response
    } catch (error) {
        console.error('Error investigating block:', error)
        blockDetail.value = { status: 'ERROR', logsChecked: 0, message: error.message }
    } finally {
        if (block) block.investigating = false
    }
}

// เพิ่มฟังก์ชันยืนยันการ Export
const confirmExport = async () => {
    try {
        isLoading.value = true
        const config = useRuntimeConfig()
        // const queryParams = new URLSearchParams({
        //     ...(filter.value.search && { search: filter.value.search }),
        //     ...(filter.value.action && { action: filter.value.action }),
        //     ...(filter.value.date && { startDate: filter.value.date, endDate: filter.value.date }),
        //     ...(filter.value.startTime && { startTime: filter.value.startTime }),
        //     ...(filter.value.endTime && { endTime: filter.value.endTime })
        // })

        const queryParams = new URLSearchParams({
            ...(filter.value.search && { search: filter.value.search }),
            ...(filter.value.action && { action: filter.value.action }),
            ...(filter.value.startDate && { startDate: filter.value.startDate }),
            ...(filter.value.endDate && { endDate: filter.value.endDate }),
            ...(filter.value.startTime && { startTime: filter.value.startTime }),
            ...(filter.value.endTime && { endTime: filter.value.endTime })
        })

        const token = useCookie('token').value
        // Ensure baseURL ends with / to avoid URL concatenation issues
        const baseURL = config.public.apiBase.endsWith('/') ? config.public.apiBase : config.public.apiBase + '/'
        const url = `${baseURL}system-logs/export?${queryParams}`

        // Use native fetch to bypass Nuxt $fetch onResponse middleware
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
            },
            credentials: 'include'
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `Export failed with status ${response.status}`)
        }

        const blob = await response.blob()

        // Create download link
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.setAttribute('download', `painamnae_logs_${Date.now()}.json`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)

        showExportModal.value = false
        alert('ไฟล์ได้รับการ export เรียบร้อยแล้ว')
    } catch (error) {
        console.error('Error exporting logs:', error)
        alert('ไม่สามารถ export ข้อมูลได้: ' + (error.message || 'Unknown error'))
    } finally {
        isLoading.value = false
    }
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
        'SOS_TRIGGERED': 'bg-red-600 text-white border-red-600 animate-pulse',
        'REGISTER': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'PROFILE_UPDATE': 'bg-indigo-100 text-indigo-700 border-indigo-200',
        'ROUTE_CREATE': 'bg-teal-100 text-teal-700 border-teal-200',
        'ROUTE_CANCEL': 'bg-slate-100 text-slate-600 border-slate-200',
        'BOOKING_REQUEST': 'bg-orange-100 text-orange-700 border-orange-200',
        'BOOKING_CONFIRM': 'bg-green-100 text-green-700 border-green-200',
        'BOOKING_REJECT': 'bg-red-100 text-red-700 border-red-200',
        'VERIFY_APPROVE': 'bg-blue-100 text-blue-700 border-blue-200',
        'VERIFY_REJECT': 'bg-rose-100 text-rose-700 border-rose-200'

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
        'SOS_TRIGGERED': 'fas fa-bell',
        'REGISTER': 'fas fa-user-plus',
        'PROFILE_UPDATE': 'fas fa-user-cog',
        'ROUTE_CREATE': 'fas fa-map-marker-alt',
        'ROUTE_CANCEL': 'fas fa-times-circle',
        'BOOKING_REQUEST': 'fas fa-ticket-alt',
        'BOOKING_CONFIRM': 'fas fa-check-double',
        'BOOKING_REJECT': 'fas fa-ban',
        'VERIFY_APPROVE': 'fas fa-id-card',
        'VERIFY_REJECT': 'fas fa-file-excel'
    }
    return map[action] || 'fas fa-circle'
}

useHead({
    title: 'System Logs | Admin',
    link: [
        { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css' }
    ]
})

// --- Watchers and Lifecycle ---

// Watch page changes and fetch new data
watch(page, () => {
    fetchLogs()
})

// Load initial data on component mount
onMounted(() => {
    fetchLogs()
})
</script>

<style scoped>
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