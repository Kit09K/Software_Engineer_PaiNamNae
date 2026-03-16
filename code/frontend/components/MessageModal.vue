<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="close">
    <div class="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
      <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      <p class="mt-1 text-sm text-gray-600">{{ subtitle }}</p>
      
      <div v-if="quickTags && quickTags.length > 0" class="flex flex-wrap gap-2 mt-4">
        <button
          v-for="(tag, index) in quickTags"
          :key="index"
          @click="addTag(tag)"
          class="px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 hover:border-blue-300"
        >
          {{ tag }}
        </button>
      </div>

      <div class="mt-4">
        <label class="block mb-1 text-sm font-medium text-gray-700">ข้อความ</label>
        <textarea
          v-model="message"
          class="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows="4"
          placeholder="พิมพ์ข้อความของคุณที่นี่...."
          :maxlength="maxLength"
        ></textarea>
        <div class="mt-1 text-xs text-gray-500 text-right">
          {{ message.length }}/{{ maxLength }}
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-6">
        <button
          @click="close"
          class="px-4 py-2 text-sm font-medium text-gray-700 transition duration-200 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          ยกเลิก
        </button>
        <button
          @click="send"
          :disabled="!message.trim()"
          class="px-4 py-2 text-sm font-medium text-white transition duration-200 bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ส่งข้อความ
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'ส่งข้อความ'
  },
  subtitle: {
    type: String,
    default: 'พิมพ์ข้อความที่ต้องการส่ง'
  },
  maxLength: {
    type: Number,
    default: 500
  },
  
  quickTags: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'send'])
const message = ref('')

// ฟังก์ชันเมื่อกดปุ่ม Tag
const addTag = (tag) => {
  message.value = tag
}

const close = () => {
  message.value = ''
  emit('close')
}

const send = () => {
  if (message.value.trim()) {
    emit('send', message.value.trim())
    message.value = ''
  }
}
</script>