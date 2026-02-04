<template>
  <div class="stock-settings">
    <div class="settings-item">
      <label>股票代码</label>
      <input
        v-model="stockCode"
        type="text"
        placeholder="如: sh600000"
        @keyup.enter="handleConfirm"
      />
    </div>
    <div class="settings-item">
      <label>开始日期</label>
      <input
        v-model="startDate"
        type="date"
      />
    </div>
    <div class="settings-item">
      <label>训练天数</label>
      <input
        v-model="trainDays"
        type="number"
        min="10"
        max="200"
      />
    </div>
    <button class="confirm-button" @click="handleConfirm">
      确定
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const emit = defineEmits<{
  confirm: [code: string, startDate: string, trainDays: number]
}>()

const stockCode = ref('sh600000')
const startDate = ref('')
const trainDays = ref(100)

onMounted(() => {
  // 设置默认开始日期为今天之前100天
  const today = new Date()
  const defaultDate = new Date(today.getTime() - 100 * 24 * 60 * 60 * 1000)
  startDate.value = defaultDate.toISOString().split('T')[0]
})

function handleConfirm() {
  if (!stockCode.value || !startDate.value) {
    alert('请输入股票代码和开始日期')
    return
  }
  emit('confirm', stockCode.value, startDate.value, parseInt(trainDays.value))
}
</script>

<style scoped>
.stock-settings {
  background: #fff;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.settings-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.settings-item label {
  width: 80px;
  font-size: 14px;
  color: #333;
}

.settings-item input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.settings-item input:focus {
  border-color: var(--primary-purple);
}

.confirm-button {
  width: 100%;
  padding: 12px;
  background: var(--primary-purple);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-button:hover {
  background: var(--dark-purple);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(123, 95, 215, 0.3);
}
</style>
