<template>
  <div class="min-h-screen py-12 bg-gray-50 font-kanit">
    <div class="max-w-3xl px-4 mx-auto sm:px-6 lg:px-8">
      <div class="overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-sm relative">
        <div class="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <h1 class="text-xl font-bold text-gray-900">การแจ้งเตือนทั้งหมด</h1>
          
          <div class="flex items-center gap-6"> 
            <button @click="markAllAsRead" class="text-sm font-medium text-blue-600 hover:text-blue-800">
              ทำเครื่องหมายอ่านแล้วทั้งหมด
            </button>
            
            <button @click="deleteAll" class="text-sm font-medium text-red-500 hover:text-red-700">
              ลบทั้งหมด
            </button>
          </div>
        </div>

        <div class="divide-y divide-gray-100">
          <div v-if="loading" class="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
          
          <div v-else-if="notifications.length === 0" class="p-12 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gray-100 rounded-full">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405C18.21 14.79 18 13.918 18 13V9a6 6 0 10-12 0v4c0 .918-.21 1.79-.595 2.595L4 17h5m6 0a3 3 0 11-6 0h6z" />
              </svg>
            </div>
            <p class="text-gray-500">ไม่มีรายการแจ้งเตือน</p>
          </div>

          <div v-for="n in notifications" :key="n.id" 
            :class="['p-6 transition-colors border-b border-gray-100 last:border-0', n.readAt ? 'bg-white' : 'bg-blue-50/20']">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 pt-1">
              </div>
            
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <h3 class="text-sm font-bold text-gray-900 truncate">{{ n.title }}</h3>
                  <span class="text-xs text-gray-400 shrink-0">{{ formatFullDate(n.createdAt) }}</span>
                </div>
                <p class="text-sm text-gray-600 leading-relaxed">{{ n.body }}</p>

                <div class="flex justify-end gap-3 mt-3">
                  <button 
                    v-if="isDriverMessage(n)" 
                    @click="toggleReply(n.id)" 
                    class="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    {{ activeReplyId === n.id ? 'ยกเลิกตอบกลับ' : 'ตอบกลับ' }}
                  </button>
                
                  <button v-if="!n.readAt" @click="readSingle(n.id)" class="text-xs font-medium text-gray-500">
                    อ่านแล้ว
                  </button>
                  <button @click="deleteSingle(n.id)" class="text-xs font-medium text-red-500 hover:text-red-700">
                    ลบ
                  </button>
                </div>
              
                <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0">
                  <div v-if="activeReplyId === n.id" class="mt-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <div class="flex flex-wrap gap-1.5 mb-2">
                      <button v-for="tag in passengerTags" :key="tag" @click="replyTexts[n.id] = tag"
                        class="px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-white border border-blue-200 rounded-full hover:bg-blue-50">
                        {{ tag }}
                      </button>
                    </div>
                    <textarea 
                      v-model="replyTexts[n.id]"
                      rows="2"
                      placeholder="พิมพ์ข้อความตอบกลับไปยังคนขับ..."
                      class="w-full p-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                    ></textarea>
                    <div class="flex justify-end mt-2">
                      <button 
                        @click="submitReply(n)"
                        :disabled="isSendingReply || !replyTexts[n.id]?.trim()"
                        class="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {{ isSendingReply ? 'กำลังส่ง...' : 'ส่งข้อความ' }}
                      </button>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="showConfirmModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        <div class="w-full max-w-sm p-6 bg-white rounded-2xl shadow-xl transform transition-all">
          <div class="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            <svg class="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 class="mb-2 text-lg font-bold text-center text-gray-900">{{ confirmTitle }}</h3>
          <p class="mb-6 text-sm text-center text-gray-500">{{ confirmMessage }}</p>
          
          <div class="flex gap-3">
            <button @click="closeConfirm" class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              ยกเลิก
            </button>
            <button @click="executeConfirm" class="flex-1 px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm">
              ยืนยัน
            </button>
          </div>
        </div>
      </div>
    </transition>
    
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRuntimeConfig, useCookie } from '#app' 

const notifications = ref([])
const loading = ref(true)
const config = useRuntimeConfig()
const apiBase = config.public.apiBase || 'http://localhost:3000/api' 
const activeReplyId = ref(null)      
const replyTexts = ref({})           
const isSendingReply = ref(false)    
const passengerTags = ['รับทราบครับ', 'โอเคครับ', 'กำลังรีบเดินไปครับ', 'ขอเวลาสักครู่ครับ']

let notificationPollTimer = null 

// 🟢 ตัวแปรสำหรับจัดการกล่อง Modal ยืนยัน
const showConfirmModal = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmAction = ref(null)

// 🟢 ฟังก์ชันเปิด-ปิด-ทำงาน Modal
const openConfirm = (title, message, action) => {
  confirmTitle.value = title
  confirmMessage.value = message
  confirmAction.value = action
  showConfirmModal.value = true
}

const closeConfirm = () => {
  showConfirmModal.value = false
  confirmAction.value = null
}

const executeConfirm = async () => {
  const actionToRun = confirmAction.value
  
  // 2. สั่งปิดกล่อง Modal "ทันที!" (ไม่ต้องรอ API ทำงาน)
  closeConfirm()

  // 3. สั่งรันคำสั่งลบข้อมูล
  if (actionToRun) {
    try {
      await actionToRun() 
    } catch (e) {
      // ดักจับ Error ไว้ตรงนี้ เพื่อไม่ให้มันลามไปพังส่วนอื่นของหน้าเว็บ
      console.error("เกิดข้อผิดพลาดตอนทำงาน:", e)
    }
  }
}

// ดึง Token
const getToken = () => useCookie('token').value || (process.client ? localStorage.getItem('token') : '')

const fetchAll = async (isSilent = false) => {
    if (!isSilent) loading.value = true
    try {
        const res = await $fetch(`${apiBase}/notifications`, {
            headers: { Authorization: `Bearer ${getToken()}` },
            query: { page: 1, limit: 50 }
        })
        
        notifications.value = res.data.map(n => ({
            id: n.id,
            title: n.title,
            body: n.body,
            type: n.metadata?.type || 'info',
            createdAt: n.createdAt,
            readAt: n.readAt,
            metadata: n.metadata 
        }))
    } catch (e) {
        console.error("Fetch error:", e)
    } finally {
        if (!isSilent) loading.value = false
    }
}

const refreshNotifications = async () => {
    await fetchAll(true)
}

const formatFullDate = (ts) => {
    return new Date(ts).toLocaleString('th-TH', { 
        dateStyle: 'medium', 
        timeStyle: 'short' 
    })
}

const readSingle = async (id) => {
    try {
        await $fetch(`${apiBase}/notifications/${id}/read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${getToken()}` }
        })
        const item = notifications.value.find(n => n.id === id)
        if (item) item.readAt = new Date().toISOString()
        window.dispatchEvent(new Event('notification-updated'))
    } catch (e) {

    }
}

// 🟢 แก้ไข API: ลบรายการเดียว เรียก Modal แทน confirm()
const deleteSingle = (id) => {
    openConfirm(
      'ยืนยันการลบ',
      'คุณต้องการลบการแจ้งเตือนนี้ใช่หรือไม่?',
      async () => {
        try {
            await $fetch(`${apiBase}/notifications/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` }
            })
            notifications.value = notifications.value.filter(n => n.id !== id)
            window.dispatchEvent(new Event('notification-updated'))
        } catch (e) { 

        }
      }
    )
}

const markAllAsRead = async () => {
    try {
        await $fetch(`${apiBase}/notifications/read-all`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${getToken()}` }
        })
        notifications.value.forEach(n => n.readAt = new Date().toISOString())
        window.dispatchEvent(new Event('notification-updated'))
    } catch (e) { 

    }
}

// 🟢 แก้ไข API: ลบทั้งหมด เรียก Modal แทน confirm()
const deleteAll = () => {
    if (notifications.value.length === 0) return;
    
    openConfirm(
      'ยืนยันการลบทั้งหมด',
      'คุณต้องการลบการแจ้งเตือน "ทั้งหมด" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
      async () => {
        loading.value = true;
        try {
            const tk = getToken();
            const deletePromises = notifications.value.map(n => 
                $fetch(`${apiBase}/notifications/${n.id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${tk}` }
                }).catch(err => console.warn(`ลบ ${n.id} ไม่สำเร็จ:`, err)) 
            );
            await Promise.all(deletePromises);
            notifications.value = [];
            window.dispatchEvent(new Event('notification-updated'));
        } catch (e) { 
            console.error("Delete all error:", e);
        } finally {
            loading.value = false;
        }
      }
    )
}

const isDriverMessage = (n) => {
    const title = n.title.toLowerCase()
    const body = n.body.toLowerCase()
    return title.includes('คนขับ') || title.includes('driver') || body.includes('ถึงจุดนัดรับ') || n.title.includes('ข้อความจากผู้ขับ')
}

const toggleReply = (id) => {
    if (activeReplyId.value === id) {
        activeReplyId.value = null
    } else {
        activeReplyId.value = id
        if (!replyTexts.value[id]) replyTexts.value[id] = '' 
    }
}

const submitReply = async (n) => {
  try {
    const message = replyTexts.value[n.id]
    const bookingId = n.metadata?.bookingId 

    if (!bookingId) {
      alert('ไม่พบข้อมูลการจอง (Booking ID)')
      return
    }

    if (!message?.trim()) {
      alert('กรุณาพิมพ์ข้อความตอบกลับ')
      return
    }

    isSendingReply.value = true
    const tk = getToken() 

    await $fetch('/push-notifications/send-message', {
      baseURL: apiBase,
      method: 'POST',
      headers: { 
        Accept: 'application/json', 
        ...(tk ? { Authorization: `Bearer ${tk}` } : {}) 
      },
      body: {
        bookingId: bookingId,
        message: message.trim()
      }
    })

    replyTexts.value[n.id] = ''
    activeReplyId.value = null
    
    window.dispatchEvent(new Event('notification-updated'))
    
    if (!n.readAt) {
      await readSingle(n.id)
    }
    
    await refreshNotifications()
  } catch (e) {
    console.error('Failed to reply to driver', e)
  } finally {
    isSendingReply.value = false
  }
}

const onNotificationsUpdated = () => {
    refreshNotifications()
}

onMounted(() => {
    fetchAll()

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'notification-updated') {
                refreshNotifications(); 
            }
        });
    }
})

onUnmounted(() => {
    if (notificationPollTimer) {
        clearInterval(notificationPollTimer)
        notificationPollTimer = null
    }
    window.removeEventListener('notification-updated', onNotificationsUpdated)
})
</script>

<style scoped>
.font-kanit {
    font-family: 'Kanit', sans-serif;
}
</style>